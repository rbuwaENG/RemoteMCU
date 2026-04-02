/**
 * compileJobs.ts — Firestore service for the compile-and-flash job system.
 *
 * A compileJob document stores the full sketch source code and tracks
 * the status of each compile+flash operation initiated from the editor.
 *
 * The host-agent reads the code from here, compiles it locally, flashes
 * the binary to the physical device, then writes the result back here.
 * The browser watches the document via onSnapshot for real-time updates.
 */

import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Types ──────────────────────────────────────────────────────────────────

export type CompileJobStatus =
  | "queued"     // Job created, waiting for agent to pick it up
  | "fetching"   // Agent is downloading code from Firestore
  | "compiling"  // arduino-cli is running on the host machine
  | "compiled"   // Compilation succeeded, about to flash
  | "flashing"   // Binary is being written to the device via USB
  | "flashed"    // ✅ Complete — device has the new firmware
  | "error";     // ❌ Failed at some stage — see errors[]

export interface CompileError {
  line: number;
  column: number;
  type: "error" | "warning";
  message: string;
  codeSnippet?: string;
}

export interface CompileJob {
  id: string;
  code: string;            // Full Arduino sketch source
  board: string;           // e.g. "esp32", "arduino-uno"
  deviceId: string;        // Firestore device document ID
  ownerId: string;         // Firebase Auth UID of the submitter
  status: CompileJobStatus;
  errors: CompileError[];
  warnings: CompileError[];
  rawOutput?: string;      // Full arduino-cli stdout+stderr
  binarySize?: number;     // Bytes of compiled binary (display only)
  durationMs?: number;     // Total compile+flash time
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

/** Fields required to create a new compile job */
export type CreateCompileJobInput = Pick<
  CompileJob,
  "code" | "board" | "deviceId" | "ownerId"
>;

// ── Status helpers ─────────────────────────────────────────────────────────

/** Human-readable status label for display in the editor UI */
export const JOB_STATUS_LABELS: Record<CompileJobStatus, string> = {
  queued:    "Waiting for agent…",
  fetching:  "Agent fetching code…",
  compiling: "Compiling sketch…",
  compiled:  "Compilation OK — flashing…",
  flashing:  "Flashing firmware…",
  flashed:   "Flash complete!",
  error:     "Compilation failed",
};

/** Whether the job is still in progress (not yet terminal) */
export function isJobInProgress(status: CompileJobStatus): boolean {
  return !["flashed", "error"].includes(status);
}

/** Whether a status represents a terminal success */
export function isJobSuccessful(status: CompileJobStatus): boolean {
  return status === "flashed";
}

// ── Firestore operations ───────────────────────────────────────────────────

/**
 * Create a new compile job document in Firestore.
 *
 * Returns the new job ID, which is sent to the host-agent via MQTT
 * as the signal to begin compilation. The MQTT payload is only the ID —
 * the agent fetches the full code from Firestore.
 */
export async function createCompileJob(
  input: CreateCompileJobInput
): Promise<string> {
  const jobsRef = collection(db, "compileJobs");

  const docRef = await addDoc(jobsRef, {
    code: input.code,
    board: input.board,
    deviceId: input.deviceId,
    ownerId: input.ownerId,
    status: "queued" as CompileJobStatus,
    errors: [],
    warnings: [],
    rawOutput: null,
    binarySize: null,
    durationMs: null,
    createdAt: serverTimestamp(),
    completedAt: null,
  });

  return docRef.id;
}

/**
 * Subscribe to real-time updates on a compile job.
 *
 * The callback is fired immediately with the current state and then
 * again every time the host-agent writes a status update.
 *
 * @returns Unsubscribe function — call it in useEffect cleanup.
 */
export function onCompileJobSnapshot(
  jobId: string,
  callback: (job: CompileJob | null) => void
): Unsubscribe {
  const jobRef = doc(db, "compileJobs", jobId);

  return onSnapshot(jobRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }

    const data = snap.data();
    callback({
      id: snap.id,
      code: data.code ?? "",
      board: data.board ?? "esp32",
      deviceId: data.deviceId ?? "",
      ownerId: data.ownerId ?? "",
      status: data.status ?? "queued",
      errors: data.errors ?? [],
      warnings: data.warnings ?? [],
      rawOutput: data.rawOutput ?? undefined,
      binarySize: data.binarySize ?? undefined,
      durationMs: data.durationMs ?? undefined,
      createdAt: data.createdAt,
      completedAt: data.completedAt ?? undefined,
    } satisfies CompileJob);
  });
}

/**
 * Fetch a single compile job once (no real-time subscription).
 * Useful for displaying historical job results.
 */
export async function getCompileJob(jobId: string): Promise<CompileJob | null> {
  const snap = await getDoc(doc(db, "compileJobs", jobId));
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    code: data.code ?? "",
    board: data.board ?? "esp32",
    deviceId: data.deviceId ?? "",
    ownerId: data.ownerId ?? "",
    status: data.status ?? "queued",
    errors: data.errors ?? [],
    warnings: data.warnings ?? [],
    rawOutput: data.rawOutput ?? undefined,
    binarySize: data.binarySize ?? undefined,
    durationMs: data.durationMs ?? undefined,
    createdAt: data.createdAt,
    completedAt: data.completedAt ?? undefined,
  };
}

/**
 * Fetch the most recent compile jobs for a device (for history display).
 * Returns up to `limitCount` jobs ordered by creation time descending.
 */
export async function getRecentCompileJobs(
  deviceId: string,
  ownerId: string,
  limitCount = 10
): Promise<CompileJob[]> {
  const q = query(
    collection(db, "compileJobs"),
    where("deviceId", "==", deviceId),
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      code: data.code ?? "",
      board: data.board ?? "esp32",
      deviceId: data.deviceId ?? "",
      ownerId: data.ownerId ?? "",
      status: data.status ?? "queued",
      errors: data.errors ?? [],
      warnings: data.warnings ?? [],
      rawOutput: data.rawOutput ?? undefined,
      binarySize: data.binarySize ?? undefined,
      durationMs: data.durationMs ?? undefined,
      createdAt: data.createdAt,
      completedAt: data.completedAt ?? undefined,
    };
  });
}
