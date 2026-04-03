"use client";

import "@/styles/globals.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToDevice, Device, updateDevice, sendSerialCommand, addActiveSession, removeActiveSession, getDevice } from "@/lib/firestore/devices";
import { burnCredits } from "@/lib/firestore/credits";
import { useCreditBurnRates } from "@/lib/hooks/useCreditBurnRates";
import { useNotifications } from "@/lib/hooks/useNotifications";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { createCompileJob, JOB_STATUS_LABELS, isJobInProgress } from "@/lib/firestore/compileJobs";
import { useCompileJob } from "@/hooks/useCompileJob";

type DebugTab = "workspace" | "debugger" | "compiler" | "flasher" | "docs";

// Send jobId signal to host-agent via MQTT
async function signalAgent(deviceId: string, jobId: string) {
  try {
    const mqtt = await import("mqtt");
    const client = mqtt.connect(process.env.NEXT_PUBLIC_MQTT_BROKER_URL!, {
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      clientId: `browser-ctrl-${Math.random().toString(36).slice(2)}`,
    });
    await new Promise<void>((resolve, reject) => {
      client.once("connect", () => {
        client.publish(
          `remotemcu/device/${deviceId}/command/compile`,
          JSON.stringify({ jobId }),
          { qos: 1 },
          () => { client.end(); resolve(); }
        );
      });
      client.once("error", reject);
      setTimeout(() => reject(new Error("timeout")), 8000);
    });
  } catch (e) {
    console.warn("[Device] MQTT signal failed (agent will poll Firestore):", e);
  }
}

export default function DeviceDebugPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const deviceId = params.id as string;
  const { rates: burnRates } = useCreditBurnRates();
  const { addNotification } = useNotifications();
  
  const [device, setDevice] = useState<Device | null>(null);
  const [activeTab, setActiveTab] = useState<DebugTab>("workspace");
  const [loading, setLoading] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [showBootScreen, setShowBootScreen] = useState(true);
  
  const [code, setCode] = useState(`#include <WiFi.h>
#include <ESPAsyncWebServer.h>

// Network credentials
const char* ssid = "SYNTH_NETWORK";
const char* password = "LOGIC_GATES_01";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
}

void loop() {
  // Processing sensor data stream...
  readSensorData();
  delay(10);
}`);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const deviceRef = useRef<Device | null>(null);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (!deviceId) return;
    
    let prevSessionState = false;
    
    const unsubscribe = subscribeToDevice(deviceId, (deviceData) => {
      setDevice(deviceData);
      deviceRef.current = deviceData;
      setLoading(false);
      
      const hasSession = deviceData?.activeSessions?.find(s => s.userId === user?.uid);
      if (prevSessionState && !hasSession) {
        console.log("Session revoked detected via subscription, redirecting immediately...");
        addNotification("error", "Session Terminated", "Your access has been revoked by the owner.");
        setTimeout(() => {
          router.push("/dashboard/devices");
        }, 3000);
        return;
      }
      if (hasSession) {
        prevSessionState = true;
      }
    });
    
    return () => unsubscribe();
  }, [deviceId, user]);

  useEffect(() => {
    if (!deviceId || !user) return;
    
    const registerSession = async () => {
      const device = await getDevice(deviceId);
      if (!device) return;

      const isOwner = device.ownerId === user.uid;
      const isSharedUser = device.sharedWith?.includes(user.uid);
      
      // If NOT the owner and NOT a shared user, they shouldn't even be here, 
      // but we do an extra check before burning.
      if (!isOwner && !isSharedUser) return;

      // Check if session already exists for this user to avoid double charging on refresh
      const existingSession = device.activeSessions?.find(s => s.userId === user.uid);
      const isNewSession = !existingSession;

      const durationMinutes = device.sessionDurationMinutes || 0;
      let expiresAt: Date | undefined;
      
      if (durationMinutes > 0) {
        expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
      }
      
      // UPFRONT CREDIT BURN for new sessions
      if (isNewSession && durationMinutes > 0) {
        const defaultRates = [{ id: "session_per_hour", creditsPerUnit: 1 }];
        const rates = burnRates.length > 0 ? burnRates : defaultRates;
        const activeSessionRate = rates.find(r => r.id === "session_per_hour") || rates[0];
        
        const creditsPerHour = activeSessionRate?.creditsPerUnit || 1;
        const totalCreditsToBurn = (durationMinutes / 60) * creditsPerHour;

        try {
          await burnCredits(
            user.uid,
            totalCreditsToBurn,
            deviceId,
            device.name || "Unknown Device",
            `Remote Session (${durationMinutes} mins)`
          );
          addNotification("success", "Session Started", `${totalCreditsToBurn.toFixed(2)} credits deducted for ${durationMinutes} minute session.`);
        } catch (error: any) {
          console.error("[Session] Failed to burn credits:", error);
          if (error.message?.includes("Insufficient")) {
            addNotification("error", "Insufficient Credits", "You do not have enough credits to start this session.");
            router.push("/dashboard/credits");
            return;
          }
        }
      }
      
      await addActiveSession(deviceId, {
        userId: user.uid,
        displayName: user.displayName || "User",
        email: user.email || "",
        connectedAt: new Date(),
        expiresAt
      });
    };
    
    registerSession();
    
    const checkSessionExpiry = setInterval(() => {
      getDevice(deviceId).then(device => {
        if (!device?.activeSessions?.find(s => s.userId === user.uid)) {
          console.log("User session was revoked by owner (polling check)");
          removeActiveSession(deviceId, user.uid);
          alert("Your session has been revoked by the owner.");
          router.push("/dashboard/devices");
          return;
        }
        
        const session = device?.activeSessions?.find(s => s.userId === user.uid);
        if (session?.expiresAt) {
          const expiryDate = session.expiresAt.toDate ? session.expiresAt.toDate() : new Date(session.expiresAt.seconds * 1000);
          if (expiryDate < new Date()) {
            removeActiveSession(deviceId, user.uid);
            alert("Your session has expired. You have been disconnected.");
            router.push("/dashboard/devices");
          }
        }
      }).catch(console.error);
    }, 10000);
    
    return () => {
      removeActiveSession(deviceId, user.uid);
      clearInterval(checkSessionExpiry);
    };
  }, [deviceId, user]);

  useEffect(() => {
    if (!deviceId || !user) return;
    
    // We already handled upfront burning in registerSession.
    // So we just show the connection message here.
    addNotification("info", "Connected", `Device ${device?.name || ""} is active.`);
    
    // No interval-based burning anymore as per user request.
    return () => {
      removeActiveSession(deviceId, user.uid);
    };
  }, [deviceId, user]); // Note: removed burnRates dependency as it is handled in registerSession

  useEffect(() => {
    if (showBootScreen) {
      const interval = setInterval(() => {
        setBootProgress(prev => {
          if (prev >= 100) {
            setTimeout(() => setShowBootScreen(false), 500);
            return 100;
          }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [showBootScreen]);

  const [serialOutput, setSerialOutput] = useState<{ time: string; msg: string; type: string }[]>([]);
  const [serialInput, setSerialInput] = useState("");

  // ── Phase 12: Real compile job state ──────────────────────────────────
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [submittingJob, setSubmittingJob] = useState(false);
  const { job, isWorking, didSucceed, didFail, errorCount, warningCount } = useCompileJob(currentJobId);

  // Derived compile output for the compiler tab panel
  const flashProgress = job?.status === "flashing" ? 60 : job?.status === "flashed" ? 100 : 0;
  const isFlashing = job?.status === "flashing";

  const [cameraOn, setCameraOn] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setVideoStream(stream);
      setCameraOn(true);
    } catch (error) {
      console.error("Failed to access camera:", error);
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setCameraOn(false);
  };

  const handleSendCommand = async () => {
    if (!serialInput.trim() || !deviceId || !user) return;
    
    try {
      await sendSerialCommand(deviceId, serialInput);
      setSerialOutput(prev => [...prev, {
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        msg: `> ${serialInput}`,
        type: 'command'
      }]);
      setSerialInput("");
    } catch (error) {
      console.error("Failed to send command:", error);
    }
  };

  // ── Real compile & flash handler (Phase 12) ───────────────────────────
  const handleCompile = useCallback(async () => {
    if (!user) { alert("Please log in first."); return; }
    if (!device) {
      addLog("No device loaded — cannot compile.", "error");
      return;
    }
    if (device.status !== "online") {
      addLog("Device is offline. Connect your hardware and start the host-agent.", "error");
      return;
    }
    if (!code.trim()) { addLog("Sketch is empty.", "error"); return; }

    setSubmittingJob(true);
    setCurrentJobId(null);
    clearMonacoMarkers();
    addLog("Creating compile job…", "info");

    try {
      const jobId = await createCompileJob({
        code,
        board: device.board || "esp32",
        deviceId,
        ownerId: user.uid,
      });
      setCurrentJobId(jobId);
      addLog(`Job ${jobId.slice(0, 8)} queued — signalling agent…`, "info");
      await signalAgent(deviceId, jobId);
      addLog("Agent notified. Waiting for compilation…", "info");
      setActiveTab("compiler");
    } catch (err) {
      addLog(`Failed to create job: ${err}`, "error");
    } finally {
      setSubmittingJob(false);
    }
  }, [user, device, code, deviceId]);

  const handleFlash = useCallback(async () => {
    // Flash is triggered automatically as part of the compile job.
    // This button just re-runs a compile job (which always ends in flash on success).
    await handleCompile();
  }, [handleCompile]);

  const handleUploadCode = async () => {
    if (!deviceId) return;
    try {
      await updateDevice(deviceId, { code });
      setSerialOutput(prev => [...prev, 
        { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "Uploading code...", type: 'info' },
        { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "Code uploaded successfully", type: 'success' }
      ]);
    } catch (error) {
      console.error("Failed to upload code:", error);
      setSerialOutput(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "Upload failed!", type: 'error' }]);
    }
  };

  const [debuggerRunning, setDebuggerRunning] = useState(false);
  const [debuggerPaused, setDebuggerPaused] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(device?.board || "ESP32 Dev Module");
  const [selectedPort, setSelectedPort] = useState("COM4 (USB)");
  const [firmwareFile] = useState("compiled-by-agent.bin");
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const [showPortDropdown, setShowPortDropdown] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────
  const addLog = (msg: string, type: string) => {
    setSerialOutput(prev => [...prev, {
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      msg,
      type,
    }]);
  };

  const clearMonacoMarkers = () => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) monaco.editor.setModelMarkers(model, "remotemcu", []);
    }
  };

  // ── Real-time job watcher: update serial log + Monaco markers ──────────
  useEffect(() => {
    if (!job) return;
    const status = job.status;

    // Append status changes to serial log
    addLog(JOB_STATUS_LABELS[status] || status, 
      status === "error" ? "error" : status === "flashed" ? "success" : "info");

    // Set Monaco markers on error
    if (editorRef.current && (job.errors?.length || job.warnings?.length)) {
      const model = editorRef.current.getModel();
      if (model) {
        const markers: monaco.editor.IMarkerData[] = [
          ...(job.errors ?? []),
          ...(job.warnings ?? []),
        ].map(e => ({
          startLineNumber: Math.max(1, e.line),
          startColumn: Math.max(1, e.column),
          endLineNumber: Math.max(1, e.line),
          endColumn: Math.max(1, e.column) + 40,
          message: e.message,
          severity: e.type === "error"
            ? monaco.MarkerSeverity.Error
            : monaco.MarkerSeverity.Warning,
        }));
        monaco.editor.setModelMarkers(model, "remotemcu", markers);
      }
    }

    // Auto-switch to appropriate tab
    if (status === "compiling" || status === "compiled") setActiveTab("compiler");
    if (status === "flashing" || status === "flashed") setActiveTab("flasher");
    if (status === "error") setActiveTab("compiler");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status, job?.errors?.length]);

  const boards = ["ESP32 Dev Module", "ESP8266", "Arduino Uno", "STM32", "Raspberry Pi Pico"];
  const ports = ["COM4 (USB)", "COM3 (USB)", "COM5 (USB)", "Network"];

  const handleDebugContinue = () => {
    setDebuggerRunning(true);
    setDebuggerPaused(false);
    setSerialOutput(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "Debugger: Continuing execution...", type: 'info' }]);
  };

  const handleDebugStepOver = () => {
    setSerialOutput(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "Debugger: Step over", type: 'info' }]);
  };

  const handleDebugStepInto = () => {
    setSerialOutput(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "Debugger: Step into", type: 'info' }]);
  };

  const handleDebugStepOut = () => {
    setSerialOutput(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "Debugger: Step out", type: 'info' }]);
  };

  const handleDebugRestart = () => {
    setDebuggerRunning(true);
    setDebuggerPaused(false);
    setSerialOutput(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "Debugger: Restarting...", type: 'info' }]);
  };

  const handleDebugStop = () => {
    setDebuggerRunning(false);
    setDebuggerPaused(false);
    setSerialOutput(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "Debugger: Stopped", type: 'info' }]);
  };

  const handleDisconnect = async () => {
    if (!deviceId) return;
    try {
      await updateDevice(deviceId, { status: 'offline' });
      setSerialOutput(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "Device disconnected", type: 'info' }]);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const handleConnect = async () => {
    if (!deviceId) return;
    try {
      await updateDevice(deviceId, { status: 'online' });
      setSerialOutput(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "Device connected", type: 'info' }]);
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const [variables] = useState([
    { name: "last_ms", value: "124502 (uint32_t)", type: "uint32_t" },
    { name: "status", value: "0x01 (STATUS_OK)", type: "STATUS_OK" },
    { name: "sensor_val", value: "842", type: "int" },
  ]);

  const [callStack] = useState([
    { func: "process_sensor_data", loc: "main.cpp:28", active: true },
    { func: "loop", loc: "main.cpp:24", active: false },
    { func: "main", loc: "startup.s:114", active: false },
  ]);

  const [breakpoints] = useState([
    { file: "main.cpp", line: "28", desc: "Entry into process_sensor_data", enabled: true },
    { file: "alarm.cpp", line: "42", desc: "Critical state check", enabled: false },
  ]);

  // ── Device not found guard ─────────────────────────────────────────────
  if (!loading && !device) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-on-surface gap-6">
        <span className="material-symbols-outlined text-6xl text-error">device_unknown</span>
        <h1 className="text-2xl font-bold">Device Not Found</h1>
        <p className="text-on-surface-variant font-mono text-sm">No device with ID <code className="text-primary">{deviceId}</code> exists or you don't have access.</p>
        <button className="btn btn-primary" onClick={() => router.push("/dashboard/devices")}>← Back to Devices</button>
      </div>
    );
  }

  if (showBootScreen) {
    return (
      <div className="fixed inset-0 bg-background text-on-surface font-body flex flex-col">
        <div className="fixed inset-0 grid-overlay opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #67d7dd 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-6">
          <div className="mb-16 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>memory</span>
              <h1 className="font-headline font-black text-2xl tracking-tighter text-primary">REMOTE MCU</h1>
            </div>
            <div className="h-[1px] w-12 bg-primary/30"></div>
          </div>
          <div className="relative mb-12 flex items-center justify-center">
            <div className="absolute w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="relative w-[140px] h-[140px] flex items-center justify-center border border-outline-variant/20 rounded-xl bg-surface-container-low/80 backdrop-blur-md">
              <span className="material-symbols-outlined text-6xl text-primary/50">memory</span>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary"></div>
            </div>
          </div>
          <div className="flex flex-col items-center w-full max-w-[400px]">
            <div className="flex justify-between w-full mb-3">
              <span className="font-headline font-semibold text-primary text-[14px] uppercase tracking-widest">INITIALIZING WORKSPACE...</span>
              <span className="font-mono text-primary text-[14px]">{bootProgress}%</span>
            </div>
            <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary-container" style={{ width: `${bootProgress}%` }}></div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">developer_board</span>
              <p className="font-mono text-on-surface-variant text-[12px] uppercase tracking-wider">Verifying board communication [ESP32]...</p>
            </div>
          </div>
        </main>
        <footer className="relative z-10 w-full p-8 flex justify-center">
          <div className="w-full max-w-2xl bg-surface-container-lowest/80 backdrop-blur-xl rounded-lg p-5 border border-outline-variant/10 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-error/50"></div>
              <div className="w-2 h-2 rounded-full bg-tertiary/50"></div>
              <div className="w-2 h-2 rounded-full bg-primary/50"></div>
              <span className="font-mono text-[10px] text-on-surface-variant ml-2 uppercase tracking-tighter">System Output Terminal_v1.0.4</span>
            </div>
            <div className="font-mono text-[11px] space-y-1.5 overflow-hidden">
              <div className="flex gap-3">
                <span className="text-[#4CAF50] font-bold">OK:</span>
                <span className="text-on-surface-variant">Found device on COM4 (Silicon Labs CP210x)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-[#4CAF50] font-bold">OK:</span>
                <span className="text-on-surface-variant">Handshake successful @ 115200 baud</span>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">LOAD:</span>
                <span className="text-on-surface-variant">sketch.ino... mapping memory segments</span>
              </div>
              <div className="flex gap-3 opacity-50">
                <span className="text-on-surface-variant">_</span>
              </div>
            </div>
          </div>
        </footer>
        <div className="fixed bottom-6 right-8 pointer-events-none">
          <p className="font-mono text-[10px] text-on-surface-variant/30 uppercase tracking-[0.2em]">NODE_01 // Synth_Labs // Internal_Build</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-on-surface font-body overflow-hidden">
      {/* Top Navigation Shell */}
      <header className="flex justify-between items-center w-full px-6 h-14 bg-background z-50 shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-lg font-black tracking-tighter text-primary">SYNTHETIC_LABS_v1.0</span>
          <button 
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-primary/10 transition-colors group"
            onClick={() => router.push("/dashboard/devices")}
          >
            <span className="material-symbols-outlined text-primary text-[18px]">arrow_back</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Back to Devices</span>
          </button>
          <nav className="hidden md:flex items-center gap-6 h-14">
            <button 
              className={`font-['Inter'] tracking-tighter text-sm uppercase h-full flex items-center px-1 transition-colors ${activeTab === 'workspace' ? 'text-primary border-b-2 border-primary' : 'text-[#bcc9c9] hover:text-[#f0f0f0]'}`}
              onClick={() => setActiveTab("workspace")}
            >
              WORKSPACE
            </button>
            <button 
              className={`font-['Inter'] tracking-tighter text-sm uppercase h-full flex items-center px-1 transition-colors ${activeTab === 'debugger' ? 'text-primary border-b-2 border-primary' : 'text-[#bcc9c9] hover:text-[#f0f0f0]'}`}
              onClick={() => setActiveTab("debugger")}
            >
              DEBUGGER
            </button>
            <button 
              className={`font-['Inter'] tracking-tighter text-sm uppercase h-full flex items-center px-1 transition-colors ${activeTab === 'compiler' ? 'text-primary border-b-2 border-primary' : 'text-[#bcc9c9] hover:text-[#f0f0f0]'}`}
              onClick={() => setActiveTab("compiler")}
            >
              COMPILER
            </button>
            <button 
              className={`font-['Inter'] tracking-tighter text-sm uppercase h-full flex items-center px-1 transition-colors ${activeTab === 'flasher' ? 'text-primary border-b-2 border-primary' : 'text-[#bcc9c9] hover:text-[#f0f0f0]'}`}
              onClick={() => setActiveTab("flasher")}
            >
              FLASHER
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-surface-container-low rounded-lg px-3 py-1.5 gap-2 group cursor-pointer hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>memory</span>
            <span className="text-xs font-mono tracking-wider">{device?.name || 'NODE_01_PROXIMA'}</span>
            <span className="material-symbols-outlined text-on-surface-variant text-sm" style={{ fontSize: 18 }}>expand_more</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant p-2 rounded-full hover:bg-surface-container transition-all" style={{ fontSize: 18 }}>settings</span>
            <button className="material-symbols-outlined text-error p-2 rounded-full hover:bg-error/10 transition-all" style={{ fontSize: 18 }} onClick={handleDisconnect}>power_settings_new</button>
          </div>
        </div>
      </header>

      {/* Custom Device Toolbar */}
      <div className="h-12 bg-[#252526] flex items-center justify-between px-4 border-t border-surface-container-lowest shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-[#1E1E1E] flex items-center gap-3 px-3 py-1 rounded border border-outline-variant/20 cursor-pointer">
            <span className="text-[11px] font-mono text-on-surface-variant uppercase tracking-widest">Select Device</span>
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontSize: 18 }}>developer_board</span>
            <span className="material-symbols-outlined text-xs text-on-surface-variant" style={{ fontSize: 14 }}>arrow_drop_down</span>
          </div>
          <div className="bg-primary text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            {device?.board || 'ESP32'}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${device?.status === 'online' ? 'bg-[#4CAF50] shadow-[0_0_8px_#4CAF50]' : 'bg-[#F44336]'}`}></div>
            <span className="text-xs font-medium uppercase tracking-wider">{device?.status === 'online' ? 'Connected' : 'Disconnected'}</span>
          </div>
          <button 
            className="px-4 py-1 border border-error/40 text-error rounded text-[11px] font-bold uppercase tracking-widest hover:bg-error/10 transition-colors"
            onClick={device?.status === 'online' ? handleDisconnect : handleConnect}
          >
            {device?.status === 'online' ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Main Viewport Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === "workspace" && (
          <>
            {/* Left Column: Code Editor (60%) */}
            <section className="w-[60%] flex flex-col bg-[#1E1E1E] border-r border-[#2a2a2a]">
              {/* Tab Bar */}
              <div className="h-9 bg-[#252526] flex items-center">
                <div className="bg-[#1E1E1E] h-full px-4 flex items-center gap-3 border-r border-[#2a2a2a]">
                  <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontSize: 16 }}>description</span>
                  <span className="text-xs font-mono text-on-surface tracking-tight">sketch.ino</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-[14px] hover:text-error cursor-pointer" style={{ fontSize: 14 }}>close</span>
                </div>
              </div>
              {/* Code Content */}
              <div className="flex-1 overflow-hidden flex">
                <div className="w-10 flex flex-col text-right pr-4 text-[#606060] select-none border-r border-outline-variant/10 mr-0 bg-[#1a1a1a] py-4">
                  {code.split('\n').map((_, i) => (
                    <span key={i} className="leading-6">{i + 1}</span>
                  ))}
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language="cpp"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    onMount={handleEditorMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      lineNumbers: "off",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: "on",
                      padding: { top: 16 },
                    }}
                  />
                </div>
              </div>
              {/* Bottom Action Bar */}
              <div className="h-12 bg-[#252526] flex items-center justify-between px-4 border-t border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  <button 
                    className="bg-primary-container hover:bg-primary text-on-primary-container px-4 py-1.5 rounded flex items-center gap-2 text-[11px] font-bold uppercase transition-all active:scale-95"
                    onClick={handleUploadCode}
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ fontSize: 16 }}>file_upload</span>
                    Upload
                  </button>
                  <button 
                    className="border border-primary-container/40 hover:border-primary text-primary px-4 py-1.5 rounded flex items-center gap-2 text-[11px] font-bold uppercase transition-all"
                    onClick={handleCompile}
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ fontSize: 16 }}>check_circle</span>
                    Verify
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-[#1E1E1E] px-3 py-1 rounded text-[10px] font-mono text-on-surface-variant flex items-center gap-2 border border-outline-variant/10">
                    Board: <span className="text-on-surface font-bold">ESP32 Dev Module</span>
                    <span className="material-symbols-outlined text-xs" style={{ fontSize: 14 }}>arrow_drop_down</span>
                  </div>
                  <div className="bg-[#1E1E1E] px-3 py-1 rounded text-[10px] font-mono text-on-surface-variant flex items-center gap-2 border border-outline-variant/10">
                    Port: <span className="text-on-surface font-bold">COM3 (USB)</span>
                    <span className="material-symbols-outlined text-xs" style={{ fontSize: 14 }}>arrow_drop_down</span>
                  </div>
                </div>
              </div>
            </section>
            {/* Right Column (40%) */}
            <section className="w-[40%] flex flex-col bg-background">
              {/* Top Half: Camera Feed */}
              <div className="h-1/2 flex flex-col relative group">
                <div className="flex-1 bg-black overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                  {cameraOn && (
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/10">
                      <span className="w-2 h-2 bg-error rounded-full animate-pulse shadow-[0_0_8px_red]"></span>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">📷 LIVE_FEED</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {cameraOn ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <span className="material-symbols-outlined text-6xl text-primary/30">videocam_off</span>
                        <p className="text-on-surface-variant text-sm mt-2">Camera is off</p>
                        <button 
                          onClick={startCamera}
                          className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:brightness-110 transition-all"
                        >
                          Turn On Camera
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-surface-container-high/80 backdrop-blur rounded-lg text-white hover:bg-primary hover:text-on-primary transition-all">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>photo_camera</span>
                    </button>
                    <button className="p-2 bg-surface-container-high/80 backdrop-blur rounded-lg text-white hover:bg-primary hover:text-on-primary transition-all">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>fullscreen</span>
                    </button>
                  </div>
                  {cameraOn && (
                    <div className="absolute bottom-4 left-4 text-[9px] font-mono text-white/40 flex flex-col gap-0.5">
                      <span>FPS: 24.5</span>
                      <span>RES: 1280x720</span>
                      <span>LATENCY: 42ms</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Bottom Half: Serial Monitor */}
              <div className="h-1/2 flex flex-col bg-[#1E1E1E] border-t border-[#2a2a2a]">
                <div className="h-9 bg-[#252526] flex items-center justify-between px-4">
                  <span className="text-[11px] font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontSize: 16 }}>terminal</span>
                    Serial Monitor
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-on-surface-variant font-mono">BAUD:</span>
                      <div className="bg-[#1E1E1E] px-2 py-0.5 rounded text-[10px] font-mono border border-outline-variant/20 flex items-center gap-1 cursor-pointer">
                        9600
                        <span className="material-symbols-outlined text-[14px]" style={{ fontSize: 14 }}>arrow_drop_down</span>
                      </div>
                    </div>
                    <button className="text-[10px] text-on-surface-variant hover:text-on-surface uppercase font-bold transition-colors">Clear</button>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-3 bg-primary/20 rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-2 h-2 bg-primary rounded-full"></div>
                      </div>
                      <span className="text-[9px] text-on-surface-variant font-mono">SCROLL</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-[13px] space-y-1 bg-[#131313]/50">
                  {serialOutput.length === 0 && (
                    <p className="text-on-surface-variant/40 text-xs">Serial output will appear here…</p>
                  )}
                  {serialOutput.map((line, i) => (
                    <div key={i} className={`flex gap-4 ${line.type === "pulse" ? "animate-pulse" : ""}`}>
                      <span className="w-20 text-on-surface-variant shrink-0">{line.time}</span>
                      <span className={
                        line.type === "error" ? "text-red-400" :
                        line.type === "success" ? "text-emerald-400" :
                        line.type === "pulse" ? "text-primary" : "text-on-surface"
                      }>{line.msg}</span>
                    </div>
                  ))}
                </div>
                <div className="h-12 bg-[#2D2D2D] p-2 flex items-center gap-2">
                  <input 
                    className="flex-1 bg-[#1E1E1E] border-none text-[12px] font-mono text-on-surface focus:ring-1 focus:ring-primary rounded px-3 py-1.5 placeholder:text-on-surface-variant/40"
                    placeholder="Type command to send..."
                    type="text"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
                  />
                  <button 
                    className="bg-primary px-4 py-1.5 rounded text-on-primary text-[11px] font-black uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all"
                    onClick={handleSendCommand}
                  >
                    Send
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "debugger" && (
          <div className="flex flex-1 overflow-hidden">
            {/* Code Editor Section (60%) */}
            <section className="w-[60%] flex flex-col bg-[#1E1E1E]">
              {/* Debug Toolbar */}
              <div className="h-12 bg-[#252526] flex items-center justify-between px-4 border-b border-outline-variant/10">
                <div className="flex items-center gap-1">
                  <span className="mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 mr-4">DEBUGGING: ACTIVE</span>
                  <div className="flex items-center bg-[#1E1E1E] rounded px-1 py-1">
                    <button 
                      onClick={handleDebugContinue}
                      className={`p-1.5 hover:bg-surface-bright rounded transition-all active:scale-90 ${debuggerRunning && !debuggerPaused ? 'text-primary' : 'text-on-surface-variant'}`}
                      title="Continue"
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </button>
                    <button 
                      onClick={handleDebugStepOver}
                      className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant transition-all active:scale-90" 
                      title="Step Over"
                    >
                      <span className="material-symbols-outlined">step_over</span>
                    </button>
                    <button 
                      onClick={handleDebugStepInto}
                      className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant transition-all active:scale-90" 
                      title="Step Into"
                    >
                      <span className="material-symbols-outlined">step_into</span>
                    </button>
                    <button 
                      onClick={handleDebugStepOut}
                      className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant transition-all active:scale-90" 
                      title="Step Out"
                    >
                      <span className="material-symbols-outlined">step_out</span>
                    </button>
                    <div className="w-px h-4 bg-outline-variant/30 mx-1"></div>
                    <button 
                      onClick={handleDebugRestart}
                      className="p-1.5 hover:bg-surface-bright rounded text-primary transition-all active:scale-90" 
                      title="Restart"
                    >
                      <span className="material-symbols-outlined">restart_alt</span>
                    </button>
                    <button 
                      onClick={handleDebugStop}
                      className="p-1.5 hover:bg-error/10 rounded text-error transition-all active:scale-90" 
                      title="Stop"
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stop</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(103,215,221,0.6)] animate-pulse"></div>
                    <span className="mono text-[10px] text-on-surface-variant">CPU FREQ: 16MHz</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="mono text-[10px] text-on-surface-variant">TEMP: 34°C</span>
                  </div>
                </div>
              </div>

              {/* Code with breakpoint */}
              <div className="flex-1 overflow-hidden flex">
                <div className="w-10 flex flex-col text-right pr-4 text-[#606060] select-none border-r border-outline-variant/10 bg-[#1a1a1a] py-4">
                  {code.split('\n').map((_, i) => (
                    <span key={i} className="leading-6">{i + 1}</span>
                  ))}
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language="cpp"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    onMount={handleEditorMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      lineNumbers: "off",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: "on",
                      padding: { top: 16 },
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Debug Inspector Panels (40%) */}
            <aside className="w-[40%] bg-[#1b1b1c] border-l border-outline-variant/10 overflow-y-auto">
              <div className="mb-4">
                <div className="px-4 py-2 bg-[#2a2a2a] flex items-center justify-between">
                  <h3 className="mono text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Variables</h3>
                  <span className="material-symbols-outlined text-xs text-on-surface-variant">expand_more</span>
                </div>
                <div className="p-2 space-y-1">
                  {variables.map((v, i) => (
                    <div key={i} className="flex justify-between items-center px-2 py-1 hover:bg-[#353535] rounded group">
                      <span className="mono text-[11px] text-[#bcc9c9]">{v.name}</span>
                      <span className="mono text-[11px] text-primary">{v.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="px-4 py-2 bg-[#2a2a2a] flex items-center justify-between">
                  <h3 className="mono text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Call Stack</h3>
                  <span className="material-symbols-outlined text-xs text-on-surface-variant">account_tree</span>
                </div>
                <div className="p-2 space-y-2">
                  {callStack.map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 px-2 py-1 border-l-2 ${item.active ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-[#353535]'}`}>
                      <span className="mono text-[11px] text-on-surface">{item.func}</span>
                      <span className="mono text-[9px] text-on-surface-variant">{item.loc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="px-4 py-2 bg-[#2a2a2a] flex items-center justify-between">
                  <h3 className="mono text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Breakpoints</h3>
                  <div className="flex gap-2">
                    <span className="material-symbols-outlined text-[14px] text-primary">add</span>
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant">block</span>
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  {breakpoints.map((bp, i) => (
                    <div key={i} className={`flex items-center gap-3 px-2 py-1 ${!bp.enabled ? 'opacity-50' : ''}`}>
                      <div className={`w-3 h-3 rounded-full ${bp.enabled ? 'bg-error' : 'bg-outline'} ring-2 ring-error/20`}></div>
                      <div className="flex flex-col">
                        <span className="mono text-[11px] text-[#f0f0f0]">{bp.file}:{bp.line}</span>
                        <span className="mono text-[9px] text-on-surface-variant">{bp.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {activeTab === "compiler" && (
          <div className="flex flex-1 flex-col md:flex-row">
            <section className="w-full md:w-3/5 flex flex-col bg-[#1E1E1E]">
              <div className="flex bg-[#252526] h-10 items-center">
                <div className="bg-[#1E1E1E] px-4 h-full flex items-center gap-2 border-t-2 border-primary">
                  <span className="text-[11px] font-mono text-on-surface">sketch.ino</span>
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-error cursor-pointer">close</span>
                </div>
                <button className="px-3 text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex bg-[#0e0e0e]">
                <div className="w-12 py-4 text-right pr-4 text-[#353535] select-none border-r border-outline-variant/10 bg-[#1a1a1a]">
                  {code.split('\n').map((_, i) => (
                    <span key={i} className="leading-6 block">{i + 1}</span>
                  ))}
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language="cpp"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    onMount={handleEditorMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      lineNumbers: "off",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: "on",
                      padding: { top: 16 },
                    }}
                  />
                </div>
              </div>
              <div className="h-12 bg-[#252526] flex items-center justify-between px-4 border-t border-outline-variant/10">
                <div className="flex gap-2">
                  <button 
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#264d4f] text-primary rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-all"
                    onClick={handleCompile}
                  >
                    <span className="material-symbols-outlined text-sm">check</span> Verify
                  </button>
                  <button 
                    className="flex items-center gap-1.5 px-3 py-1 bg-primary text-[#003739] rounded-sm text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-[0_0_10px_rgba(103,215,221,0.2)]"
                    onClick={handleUploadCode}
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span> Upload
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-[#353535] px-2 py-1 rounded-sm cursor-pointer hover:bg-[#393939] transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-primary">developer_board</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">Arduino Uno</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#353535] px-2 py-1 rounded-sm cursor-pointer hover:bg-[#393939] transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-primary">usb</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">COM4 (USB)</span>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-full md:w-2/5 flex flex-col bg-background overflow-hidden border-l border-outline-variant/10">
              <div className="h-10 flex items-center justify-between px-4 bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">terminal</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Compilation Output</span>
                </div>
                <div className="flex gap-3">
                  <button className="text-[10px] font-mono uppercase text-on-surface-variant hover:text-primary transition-colors">Clear</button>
                  <button className="text-[10px] font-mono uppercase text-on-surface-variant hover:text-primary transition-colors">Copy</button>
                </div>
              </div>
              <div className="flex-1 p-6 font-mono text-xs leading-relaxed bg-[#0e0e0e] overflow-auto space-y-3">
                {/* Device offline warning */}
                {device?.status !== "online" && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-start gap-3">
                    <span className="material-symbols-outlined text-yellow-400 text-[18px] shrink-0">warning</span>
                    <div>
                      <p className="text-yellow-400 font-bold mb-1">Device Offline</p>
                      <p className="text-yellow-400/70 text-[11px]">Start the RemoteMCU host-agent on the PC connected to this device before compiling.</p>
                    </div>
                  </div>
                )}

                {/* No job yet */}
                {!job && !submittingJob && (
                  <p className="text-on-surface-variant">[info] Click Verify / Compile &amp; Flash to start…</p>
                )}

                {/* Job status */}
                {job && (
                  <div className={`p-3 rounded border ${
                    job.status === "error" ? "bg-red-500/10 border-red-500/30" :
                    job.status === "flashed" ? "bg-emerald-500/10 border-emerald-500/30" :
                    "bg-primary/10 border-primary/20"
                  }`}>
                    <p className={`font-bold mb-1 ${
                      job.status === "error" ? "text-red-400" :
                      job.status === "flashed" ? "text-emerald-400" : "text-primary"
                    }`}>
                      {isWorking && <span className="inline-block w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />}
                      {JOB_STATUS_LABELS[job.status]}
                      {job.durationMs ? ` — ${(job.durationMs/1000).toFixed(1)}s` : ""}
                      {job.binarySize ? ` · ${(job.binarySize/1024).toFixed(1)} KB` : ""}
                    </p>
                  </div>
                )}

                {/* Structured errors — clickable */}
                {(job?.errors?.length ?? 0) > 0 && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                    <p className="text-red-400 font-bold mb-2">❌ {job!.errors.length} compilation error{job!.errors.length > 1 ? "s" : ""}</p>
                    {job!.errors.map((e, i) => (
                      <button
                        key={i}
                        className="w-full text-left flex gap-3 hover:bg-white/5 px-2 py-1 rounded group"
                        onClick={() => {
                          if (editorRef.current && e.line > 0) {
                            editorRef.current.revealLineInCenter(e.line);
                            editorRef.current.setPosition({ lineNumber: e.line, column: e.column || 1 });
                            editorRef.current.focus();
                            setActiveTab("compiler");
                          }
                        }}
                      >
                        <span className="text-red-400 shrink-0 w-16">L{e.line}:{e.column}</span>
                        <span className="text-red-300/80 group-hover:text-red-300">{e.message}</span>
                        <span className="ml-auto text-red-400/40 group-hover:text-red-400/70 text-[10px]">↗ jump</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {(job?.warnings?.length ?? 0) > 0 && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <p className="text-yellow-400 font-bold mb-2">⚠️ {job!.warnings.length} warning{job!.warnings.length > 1 ? "s" : ""}</p>
                    {job!.warnings.map((w, i) => (
                      <div key={i} className="text-yellow-300/70 text-[11px] mb-1">L{w.line}: {w.message}</div>
                    ))}
                  </div>
                )}

                {/* Raw output */}
                {job?.rawOutput && (
                  <details className="mt-2">
                    <summary className="text-on-surface-variant cursor-pointer hover:text-on-surface text-[11px] uppercase tracking-widest">Raw compiler output</summary>
                    <pre className="mt-2 text-on-surface-variant/60 text-[10px] whitespace-pre-wrap">{job.rawOutput}</pre>
                  </details>
                )}

                <span className="inline-block w-1.5 h-4 bg-primary animate-pulse" />
              </div>
            </section>
          </div>
        )}

        {activeTab === "flasher" && (
          <div className="flex-1 p-8 flex flex-col gap-6 overflow-auto">
            {/* Device-offline error banner */}
            {device?.status !== "online" && (
              <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <span className="material-symbols-outlined text-red-400 text-3xl shrink-0">link_off</span>
                <div>
                  <p className="text-red-400 font-bold text-lg mb-1">Device Not Connected</p>
                  <p className="text-red-300/70 text-sm">The host-agent reports this device is offline. Make sure:</p>
                  <ul className="text-red-300/60 text-xs mt-2 space-y-1 list-disc ml-4">
                    <li>Your hardware is plugged in via USB</li>
                    <li>The RemoteMCU host-agent is running on that PC</li>
                    <li>The correct device ID is registered in your account</li>
                  </ul>
                  <p className="text-red-400/70 text-xs mt-2 font-mono">Error logs from the agent will appear in the Serial Monitor once connected.</p>
                </div>
              </div>
            )}
            <div className="flex justify-between items-end border-b border-outline-variant/10 pb-4">
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-on-surface">Flash Firmware</h1>
                <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-widest mt-1">Compiled locally by host-agent · Binary never leaves your PC</p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-sm ${
                device?.status === "online" ? "bg-surface-container-low" : "bg-red-500/10"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  device?.status === "online" ? "bg-primary shadow-[0_0_8px_#67d7dd]" : "bg-red-500"
                }`}></span>
                <span className={`text-xs font-mono uppercase ${
                  device?.status === "online" ? "text-primary" : "text-red-400"
                }`}>{device?.status === "online" ? `Connected · ${device?.name || deviceId}` : "Offline — host-agent not running"}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-5 bg-surface-container p-6 rounded-lg relative overflow-hidden group">
                <h2 className="text-on-surface-variant font-mono text-[10px] uppercase tracking-widest mb-6">Device Configuration</h2>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1 relative">
                    <label className="text-[10px] text-outline font-bold uppercase tracking-tight">Select Device</label>
                    <div 
                      className="bg-surface-container-highest flex items-center px-4 py-3 rounded-sm group hover:bg-surface-bright transition-colors cursor-pointer"
                      onClick={() => setShowBoardDropdown(!showBoardDropdown)}
                    >
                      <span className="text-sm font-medium flex-1">{selectedBoard}</span>
                      <span className="material-symbols-outlined text-outline">expand_more</span>
                    </div>
                    {showBoardDropdown && (
                      <div className="absolute top-20 left-0 right-0 bg-[#1a1a1a] border border-primary/20 rounded-sm z-10">
                        {boards.map(board => (
                          <div 
                            key={board}
                            className="px-4 py-2 hover:bg-primary/20 cursor-pointer text-sm"
                            onClick={() => { setSelectedBoard(board); setShowBoardDropdown(false); }}
                          >
                            {board}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 relative">
                    <label className="text-[10px] text-outline font-bold uppercase tracking-tight">Select Port</label>
                    <div 
                      className="bg-surface-container-highest flex items-center px-4 py-3 rounded-sm group hover:bg-surface-bright transition-colors cursor-pointer"
                      onClick={() => setShowPortDropdown(!showPortDropdown)}
                    >
                      <span className="text-sm font-medium flex-1">{selectedPort}</span>
                      <span className="material-symbols-outlined text-outline">expand_more</span>
                    </div>
                    {showPortDropdown && (
                      <div className="absolute top-20 left-0 right-0 bg-[#1a1a1a] border border-primary/20 rounded-sm z-10">
                        {ports.map(port => (
                          <div 
                            key={port}
                            className="px-4 py-2 hover:bg-primary/20 cursor-pointer text-sm"
                            onClick={() => { setSelectedPort(port); setShowPortDropdown(false); }}
                          >
                            {port}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-outline font-bold uppercase tracking-tight">Firmware Binary</label>
                    <div className="bg-surface-container-highest flex items-center px-4 py-3 rounded-sm border-b-2 border-primary/20 hover:border-primary transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-primary mr-3">file_present</span>
                      <span className="text-sm font-mono flex-1 text-primary">{firmwareFile}</span>
                      <span className="text-[10px] text-outline uppercase font-bold">Change</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  <button 
                    className="flex-1 bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-lg font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCompile}
                    disabled={isWorking || submittingJob || device?.status !== "online"}
                  >
                    <span className="material-symbols-outlined text-xl">{isFlashing ? "downloading" : "bolt"}</span>
                    {isWorking || submittingJob ? (JOB_STATUS_LABELS[job?.status ?? "queued"] ?? "Working…") : "COMPILE & FLASH"}
                  </button>
                  <button
                    className="px-6 bg-surface-container-highest text-on-surface-variant py-4 rounded-lg font-bold text-sm tracking-widest uppercase hover:bg-error/10 hover:text-error transition-all active:scale-95"
                    onClick={() => { setCurrentJobId(null); }}
                  >
                    CLEAR
                  </button>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-7 bg-surface-container-high p-6 rounded-lg flex flex-col items-center justify-center text-center relative">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #67d7dd 0%, transparent 70%)' }}></div>
                <h2 className="text-on-surface-variant font-mono text-[10px] uppercase tracking-widest mb-8 self-start">Active Process</h2>
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-surface-container-highest" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="4"></circle>
                    <circle 
                      className="text-primary" 
                      cx="96" 
                      cy="96" 
                      fill="transparent" 
                      r="88" 
                      stroke="currentColor" 
                      strokeDasharray="553" 
                      strokeDashoffset={553 - (553 * flashProgress) / 100} 
                      strokeLinecap="round" 
                      strokeWidth="8"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-black text-on-surface tracking-tighter">{flashProgress}%</span>
                    <span className="text-[10px] text-primary font-mono uppercase tracking-widest">Complete</span>
                  </div>
                </div>
                <div className="mt-8 space-y-2">
                  <p className="text-on-surface font-mono text-sm">Writing at 0x00010000...</p>
                  <div className="flex items-center gap-4 text-[10px] text-outline font-mono uppercase tracking-widest">
                    <span>{Math.round(480.2 * flashProgress / 100)} KB / 640.0 KB</span>
                    <span className="text-primary">115.2 kbps</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] bg-black rounded-lg border border-outline-variant/10 flex flex-col overflow-hidden">
              <div className="bg-surface-container-highest/50 px-4 py-2 flex items-center justify-between border-b border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">terminal</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">System Output Console</span>
                </div>
                <div className="flex gap-4">
                  <span className="material-symbols-outlined text-sm text-outline hover:text-on-surface cursor-pointer">content_copy</span>
                  <span className="material-symbols-outlined text-sm text-outline hover:text-error cursor-pointer">delete</span>
                </div>
              </div>
              <div className="p-4 font-mono text-xs leading-relaxed overflow-y-auto bg-[#050505] flex-1">
                {serialOutput.length === 0 && <p className="text-outline-variant">Waiting for agent…</p>}
                {serialOutput.map((line, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-outline-variant">[{line.time}] </span>
                    <span className={
                      line.type === "error" ? "text-red-400" :
                      line.type === "success" ? "text-emerald-400" : "text-on-surface-variant"
                    }>{line.msg}</span>
                  </div>
                ))}
                {(isWorking || submittingJob) && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-outline-variant">[{new Date().toLocaleTimeString("en-US",{hour12:false})}]</span>
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Status Bar — real counts from job */}
      <footer className={`h-6 text-white text-[10px] flex items-center justify-between px-3 font-mono ${
        device?.status !== "online" ? "bg-red-700" :
        didFail ? "bg-[#5a1a1a]" :
        didSucceed ? "bg-[#1a5a2a]" :
        "bg-[#007acc]"
      }`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 px-2 h-full">
            <span className="material-symbols-outlined text-[14px]">developer_board</span>
            <span>{device?.status === "online" ? "Online" : "Offline"}</span>
          </div>
          <div
            className="flex items-center gap-1 hover:bg-white/10 px-2 cursor-pointer h-full"
            onClick={() => setActiveTab("compiler")}
          >
            <span className="material-symbols-outlined text-[14px]">error</span>
            <span>{errorCount} Error{errorCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1 hover:bg-white/10 px-2 cursor-pointer h-full">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            <span>{warningCount} Warning{warningCount !== 1 ? "s" : ""}</span>
          </div>
          {job && (
            <div className="flex items-center gap-1 px-2">
              <span>{JOB_STATUS_LABELS[job.status]}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 h-full">
          <span className="px-2">{device?.board || "Unknown board"}</span>
          <span className="px-2">UTF-8</span>
        </div>
      </footer>
    </div>
  );
}