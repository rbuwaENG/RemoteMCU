"use client";

/**
 * useCompileJob.ts — Real-time hook for tracking a compile job.
 *
 * Subscribes to a Firestore compileJobs document and returns its current
 * state. The state updates automatically as the host-agent writes progress
 * (fetching → compiling → compiled → flashing → flashed | error).
 *
 * Usage:
 *   const job = useCompileJob(currentJobId);
 *   // job.status, job.errors, job.warnings, job.rawOutput update in real-time
 */

import { useState, useEffect } from "react";
import {
  CompileJob,
  onCompileJobSnapshot,
  isJobInProgress,
} from "@/lib/firestore/compileJobs";

interface UseCompileJobResult {
  /** The current job state, or null if no job is active */
  job: CompileJob | null;
  /** True while the job is still running (not yet flashed or errored) */
  isWorking: boolean;
  /** Shortcut: true if status === "compiling" */
  isCompiling: boolean;
  /** Shortcut: true if status === "flashing" */
  isFlashing: boolean;
  /** Shortcut: true if status === "flashed" */
  didSucceed: boolean;
  /** Shortcut: true if status === "error" */
  didFail: boolean;
  /** Number of errors (0 if no errors) */
  errorCount: number;
  /** Number of warnings (0 if no warnings) */
  warningCount: number;
}

export function useCompileJob(jobId: string | null): UseCompileJobResult {
  const [job, setJob] = useState<CompileJob | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    const unsubscribe = onCompileJobSnapshot(jobId, (updatedJob) => {
      setJob(updatedJob);
    });

    return () => {
      unsubscribe();
    };
  }, [jobId]);

  const status = job?.status ?? null;

  return {
    job,
    isWorking: status !== null && isJobInProgress(status),
    isCompiling: status === "compiling",
    isFlashing: status === "flashing",
    didSucceed: status === "flashed",
    didFail: status === "error",
    errorCount: job?.errors?.length ?? 0,
    warningCount: job?.warnings?.length ?? 0,
  };
}
