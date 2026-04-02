"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import * as monaco from "monaco-editor";
import { useAuth } from "@/hooks/useAuth";
import { useCompileJob } from "@/hooks/useCompileJob";
import {
  createCompileJob,
  JOB_STATUS_LABELS,
  isJobInProgress,
} from "@/lib/firestore/compileJobs";
import CodeEditor from "@/components/editor/CodeEditor";
import OutputConsole from "@/components/editor/OutputConsole";
import ErrorPanel from "@/components/editor/ErrorPanel";

// ── MQTT publish helper ─────────────────────────────────────────────────────
// We publish only a tiny signal (the jobId) — the code is in Firestore.
async function signalAgent(deviceId: string, jobId: string) {
  // Uses MQTT over WebSocket via the browser MQTT client.
  // Import is dynamic so the MQTT library isn't included in the initial bundle.
  try {
    const mqttModule = await import("mqtt");
    const brokerUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL!;
    const client = mqttModule.connect(brokerUrl, {
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      clientId: `browser-editor-${Math.random().toString(36).slice(2)}`,
    });

    await new Promise<void>((resolve, reject) => {
      client.once("connect", () => {
        client.publish(
          `remotemcu/device/${deviceId}/command/compile`,
          JSON.stringify({ jobId }),
          { qos: 1 },
          () => {
            client.end();
            resolve();
          }
        );
      });
      client.once("error", reject);
      setTimeout(() => reject(new Error("MQTT connect timeout")), 8000);
    });
    console.log(`[Editor] MQTT signal sent for job ${jobId}`);
  } catch (err) {
    console.error("[Editor] Failed to signal agent via MQTT:", err);
    // The job is already in Firestore — the agent will pick it up
    // on its next heartbeat if the MQTT signal failed.
  }
}

// ── Tab types ───────────────────────────────────────────────────────────────
type TabType = "code" | "output" | "errors";

// ── Default sketch ───────────────────────────────────────────────────────────
const DEFAULT_CODE = `// RemoteMCU — Arduino Sketch
// Write your sketch below and click "Compile & Flash"

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.println("RemoteMCU: Setup complete!");
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.println("LED ON");
  delay(1000);

  digitalWrite(LED_BUILTIN, LOW);
  Serial.println("LED OFF");
  delay(1000);
}
`;

const BOARDS = [
  { value: "esp32",             label: "ESP32" },
  { value: "esp8266",           label: "ESP8266" },
  { value: "arduino-uno",       label: "Arduino Uno" },
  { value: "arduino-nano",      label: "Arduino Nano" },
  { value: "arduino-mega",      label: "Arduino Mega" },
  { value: "stm32",             label: "STM32" },
  { value: "raspberry-pi-pico", label: "Raspberry Pi Pico" },
];

// ── Component ───────────────────────────────────────────────────────────────
export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sketchId = params.id as string;

  // Editor state
  const [code, setCode] = useState(DEFAULT_CODE);
  const [selectedBoard, setSelectedBoard] = useState("esp32");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("code");

  // Job tracking
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outputLines, setOutputLines] = useState<string[]>([]);

  // Monaco editor ref (for setting markers and jumping to lines)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Real-time job subscription
  const { job, isWorking, didSucceed, didFail, errorCount, warningCount } =
    useCompileJob(currentJobId);

  // ── Handle job status changes ─────────────────────────────────────────────
  useEffect(() => {
    if (!job) return;

    // Append raw output lines to the output console as they arrive
    if (job.rawOutput) {
      const lines = job.rawOutput
        .split("\n")
        .filter((l) => l.trim().length > 0);
      setOutputLines(lines);
    }

    // Show output tab while working; errors tab on failure
    if (isWorking) {
      setActiveTab("output");
    } else if (didFail) {
      setActiveTab("errors");
    } else if (didSucceed) {
      setActiveTab("errors"); // shows the "flash complete" success state
    }

    // Set Monaco markers (red squiggles + yellow tildes)
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const markers: monaco.editor.IMarkerData[] = [
          ...( job.errors ?? []),
          ...(job.warnings ?? []),
        ].map((e) => ({
          startLineNumber: Math.max(1, e.line),
          startColumn: Math.max(1, e.column),
          endLineNumber: Math.max(1, e.line),
          endColumn: Math.max(1, e.column) + 30,
          message: e.message,
          severity:
            e.type === "error"
              ? monaco.MarkerSeverity.Error
              : monaco.MarkerSeverity.Warning,
        }));

        monaco.editor.setModelMarkers(model, "remotemcu-compiler", markers);
      }
    }
  }, [job, isWorking, didFail, didSucceed]);

  // ── Jump to line (called by ErrorPanel) ──────────────────────────────────
  const handleJumpToLine = useCallback((line: number, column: number) => {
    if (!editorRef.current) return;
    const safeLine = Math.max(1, line);
    const safeCol = Math.max(1, column);
    editorRef.current.revealLineInCenter(safeLine);
    editorRef.current.setPosition({ lineNumber: safeLine, column: safeCol });
    editorRef.current.focus();
    setActiveTab("code");
  }, []);

  // ── Compile & Flash ───────────────────────────────────────────────────────
  const handleCompileAndFlash = async () => {
    if (!user) {
      alert("You must be logged in to compile.");
      return;
    }
    if (!selectedDevice) {
      alert("Please select a connected device before compiling.");
      return;
    }
    if (!code.trim()) {
      alert("The sketch is empty. Write some code first!");
      return;
    }

    setSubmitting(true);
    setOutputLines([]);
    setCurrentJobId(null);

    // Clear previous Monaco markers
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelMarkers(model, "remotemcu-compiler", []);
      }
    }

    try {
      // 1. Write the job to Firestore (code lives here — not in MQTT)
      const jobId = await createCompileJob({
        code,
        board: selectedBoard,
        deviceId: selectedDevice,
        ownerId: user.uid,
      });

      setCurrentJobId(jobId);
      setActiveTab("output");
      setOutputLines([
        `[RemoteMCU] Compile job created: ${jobId}`,
        `[RemoteMCU] Board: ${selectedBoard}`,
        `[RemoteMCU] Signalling host agent…`,
      ]);

      // 2. Signal the host-agent via MQTT (tiny payload — just the jobId)
      await signalAgent(selectedDevice, jobId);
      setOutputLines((prev) => [
        ...prev,
        "[RemoteMCU] Agent notified — waiting for compilation…",
      ]);
    } catch (err) {
      console.error("[Editor] Failed to create compile job:", err);
      setOutputLines([`[RemoteMCU] Error: ${err}`]);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived UI state ──────────────────────────────────────────────────────
  const isBusy = submitting || isWorking;
  const statusLabel = job ? JOB_STATUS_LABELS[job.status] : null;

  return (
    <div
      style={{
        height: "calc(100vh - var(--navbar-height))",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex flex-between"
        style={{
          padding: "var(--space-3) var(--space-6)",
          borderBottom: "1px solid var(--outline-variant)",
          minHeight: "56px",
        }}
      >
        {/* Left: back + title */}
        <div className="flex gap-4" style={{ alignItems: "center" }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push("/dashboard/sketches")}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: "var(--title-lg)", marginBottom: 0 }}>
              Sketch {sketchId}
            </h1>
            {statusLabel && (
              <span
                style={{
                  fontSize: "var(--body-sm)",
                  color: didFail
                    ? "var(--error)"
                    : didSucceed
                    ? "var(--secondary)"
                    : "var(--primary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {statusLabel}
                {job?.binarySize && didSucceed
                  ? ` — ${(job.binarySize / 1024).toFixed(1)} KB`
                  : ""}
              </span>
            )}
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex gap-3" style={{ alignItems: "center" }}>
          {/* Board selector */}
          <select
            className="input select"
            style={{ width: "180px" }}
            value={selectedBoard}
            disabled={isBusy}
            onChange={(e) => setSelectedBoard(e.target.value)}
          >
            {BOARDS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>

          {/* Device selector — TODO: replace with real useDevices() hook */}
          <input
            className="input"
            style={{ width: "200px" }}
            placeholder="Device ID…"
            value={selectedDevice}
            disabled={isBusy}
            onChange={(e) => setSelectedDevice(e.target.value)}
          />

          {/* Compile & Flash button */}
          <button
            className="btn btn-primary"
            onClick={handleCompileAndFlash}
            disabled={isBusy}
            style={{ minWidth: "140px" }}
          >
            {isBusy ? (
              <>⏳ {job?.status === "flashing" ? "Flashing…" : "Compiling…"}</>
            ) : (
              <>⚡ Compile &amp; Flash</>
            )}
          </button>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div
        className="tabs"
        style={{ margin: "0 var(--space-6)", paddingTop: "var(--space-3)" }}
      >
        <button
          id="editor-tab-code"
          className={`tab ${activeTab === "code" ? "active" : ""}`}
          onClick={() => setActiveTab("code")}
        >
          💻 Code
        </button>
        <button
          id="editor-tab-output"
          className={`tab ${activeTab === "output" ? "active" : ""}`}
          onClick={() => setActiveTab("output")}
        >
          📟 Output
          {isBusy && (
            <span
              style={{
                marginLeft: 6,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--primary)",
                display: "inline-block",
                animation: "pulse 1s infinite",
              }}
            />
          )}
        </button>
        <button
          id="editor-tab-errors"
          className={`tab ${activeTab === "errors" ? "active" : ""}`}
          onClick={() => setActiveTab("errors")}
        >
          {errorCount > 0 ? "❌" : warningCount > 0 ? "⚠️" : "✓"} Problems
          {(errorCount > 0 || warningCount > 0) && (
            <span
              style={{
                marginLeft: 6,
                fontSize: "10px",
                background: errorCount > 0 ? "var(--error)" : "var(--warning,#f59e0b)",
                color: "#fff",
                borderRadius: "9999px",
                padding: "1px 5px",
                fontFamily: "var(--font-mono)",
              }}
            >
              {errorCount + warningCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Main content area ────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          padding: "var(--space-3) var(--space-6) var(--space-6)",
          display: "flex",
          gap: "var(--space-4)",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {activeTab === "code" && (
          <CodeEditor
            value={code}
            onChange={setCode}
            language="cpp"
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        )}

        {activeTab === "output" && (
          <OutputConsole
            output={outputLines}
            isCompiling={isBusy}
          />
        )}

        {activeTab === "errors" && (
          <div
            style={{
              flex: 1,
              background: "var(--surface-container-lowest)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            <ErrorPanel job={job} onJumpToLine={handleJumpToLine} />
          </div>
        )}
      </div>
    </div>
  );
}
