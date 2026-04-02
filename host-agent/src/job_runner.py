"""
job_runner.py — Compile → Flash orchestrator for the host-agent.

Receives a compileJob ID from MQTT, fetches the sketch code from Firestore,
compiles it locally with arduino-cli, flashes the binary to the connected
device, and writes status updates back to Firestore at every step.

The compiled binary NEVER leaves this machine — it is compiled and flashed
locally. Only the source code (stored in Firestore) and the result metadata
(errors, warnings, status) travel over the network.
"""

import os
import tempfile
import threading
import time
from typing import Optional

from compiler import Compiler
from firestore_client import FirestoreClient
from flasher import Flasher


def _firestore_timestamp() -> str:
    """Return the current time as a Firestore-compatible RFC3339 timestamp."""
    import datetime
    return datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")


class JobRunner:
    """
    Orchestrates a single compile-and-flash job.

    Flow:
        1. Update Firestore status → "fetching"
        2. Fetch code + board from Firestore compileJobs/{job_id}
        3. Update status → "compiling"
        4. Run arduino-cli compiler locally
        5a. If errors → update Firestore with error list → done
        5b. If success → update status → "flashing"
        6. Flash binary to device via USB (esptool / avrdude)
        7. Update Firestore status → "flashed" (or "error" if flash fails)
    """

    def __init__(
        self,
        firestore: FirestoreClient,
        compiler: Compiler,
        flasher: Flasher,
        device_id: str,
        mqtt_publish_fn,  # callable(topic: str, payload: dict)
    ):
        self.firestore = firestore
        self.compiler = compiler
        self.flasher = flasher
        self.device_id = device_id
        self._mqtt_publish = mqtt_publish_fn
        self._active_job_id: Optional[str] = None
        self._lock = threading.Lock()

    @property
    def is_busy(self) -> bool:
        return self._active_job_id is not None

    def run_async(self, job_id: str, port: str) -> bool:
        """
        Start a compile+flash job in a background thread.

        Returns False if another job is already running.
        """
        with self._lock:
            if self.is_busy:
                print(
                    f"[JobRunner] Job {self._active_job_id} is already running. "
                    f"Ignoring new job {job_id}."
                )
                return False
            self._active_job_id = job_id

        thread = threading.Thread(
            target=self._run_job_safe,
            args=(job_id, port),
            name=f"job-{job_id[:8]}",
            daemon=True,
        )
        thread.start()
        return True

    def _run_job_safe(self, job_id: str, port: str):
        """Wrapper that always clears _active_job_id on completion."""
        try:
            self._run_job(job_id, port)
        except Exception as e:
            print(f"[JobRunner] Unhandled exception in job {job_id}: {e}")
            self._update_job(job_id, {
                "status": "error",
                "errors": [{
                    "line": 0, "column": 0, "type": "error",
                    "message": f"Internal agent error: {e}"
                }],
                "completedAt": _firestore_timestamp(),
            })
        finally:
            with self._lock:
                self._active_job_id = None
            print(f"[JobRunner] Job {job_id} completed.")

    def _run_job(self, job_id: str, port: str):
        print(f"\n[JobRunner] ── Starting job {job_id} on port {port} ──")

        # ── Step 1: Mark as fetching ────────────────────────────────────────
        self._update_job(job_id, {"status": "fetching"})

        # ── Step 2: Fetch job document from Firestore ───────────────────────
        job = self.firestore.get_compile_job(job_id)
        if not job:
            self._update_job(job_id, {
                "status": "error",
                "errors": [{
                    "line": 0, "column": 0, "type": "error",
                    "message": f"Compile job '{job_id}' not found in Firestore.",
                }],
                "completedAt": _firestore_timestamp(),
            })
            return

        code = job.get("code", "")
        board = job.get("board", "esp32")

        if not code.strip():
            self._update_job(job_id, {
                "status": "error",
                "errors": [{
                    "line": 0, "column": 0, "type": "error",
                    "message": "Sketch is empty. Write some code before compiling.",
                }],
                "completedAt": _firestore_timestamp(),
            })
            return

        # ── Step 3: Compile ─────────────────────────────────────────────────
        self._update_job(job_id, {"status": "compiling"})
        print(f"[JobRunner] Compiling for board: {board}")

        # Use a persistent temp dir for this job so the binary survives
        # long enough to be flashed (compiler cleans up on its own with
        # compile_to_dir if we manage the directory ourselves).
        job_tmp_dir = tempfile.mkdtemp(prefix=f"rmcu_{job_id[:8]}_")

        try:
            result = self.compiler.compile_to_dir(board, code, job_tmp_dir)

            # ── Step 4a: Compile error ──────────────────────────────────────
            if not result.success:
                print(
                    f"[JobRunner] Compile failed: {len(result.errors)} errors, "
                    f"{len(result.warnings)} warnings"
                )
                self._update_job(job_id, {
                    "status": "error",
                    "errors": result.errors,
                    "warnings": result.warnings,
                    "rawOutput": result.raw_output[:10_000],  # cap at 10KB
                    "durationMs": result.duration_ms,
                    "completedAt": _firestore_timestamp(),
                })
                return

            # ── Step 4b: Compile success ────────────────────────────────────
            print(
                f"[JobRunner] Compiled OK in {result.duration_ms}ms — "
                f"binary: {result.binary_path} ({result.binary_size} bytes)"
            )
            self._update_job(job_id, {
                "status": "compiled",
                "warnings": result.warnings,
                "rawOutput": result.raw_output[:10_000],
                "binarySize": result.binary_size,
                "durationMs": result.duration_ms,
            })

            if not result.binary_path or not os.path.isfile(result.binary_path):
                self._update_job(job_id, {
                    "status": "error",
                    "errors": [{
                        "line": 0, "column": 0, "type": "error",
                        "message": "Compilation succeeded but no binary file was produced.",
                    }],
                    "completedAt": _firestore_timestamp(),
                })
                return

            # ── Step 5: Flash ───────────────────────────────────────────────
            self._update_job(job_id, {"status": "flashing"})
            print(f"[JobRunner] Flashing to {port}…")

            flash_error: Optional[str] = None

            def on_progress(pct: int, msg: str):
                """Called by Flasher as it writes to the device."""
                self._mqtt_publish(
                    f"remotemcu/device/{self.device_id}/flash/progress",
                    {"jobId": job_id, "progress": pct, "message": msg},
                )
                if pct == -1:
                    nonlocal flash_error
                    flash_error = msg

            self.flasher.flash(
                board_type=board,
                port=port,
                firmware_path=result.binary_path,
                progress_callback=on_progress,
            )

            # Give the flash thread a moment to finish
            # (Flasher.flash() is async internally)
            time.sleep(0.5)

            # ── Step 6: Done ────────────────────────────────────────────────
            if flash_error:
                self._update_job(job_id, {
                    "status": "error",
                    "errors": [{
                        "line": 0, "column": 0, "type": "error",
                        "message": f"Flash failed: {flash_error}",
                    }],
                    "completedAt": _firestore_timestamp(),
                    "durationMs": result.duration_ms,
                })
            else:
                self._update_job(job_id, {
                    "status": "flashed",
                    "completedAt": _firestore_timestamp(),
                    "durationMs": result.duration_ms,
                })
                print(f"[JobRunner] ✅ Job {job_id} complete — device flashed successfully")

        finally:
            # Clean up our temp directory
            import shutil
            try:
                shutil.rmtree(job_tmp_dir, ignore_errors=True)
            except Exception:
                pass

    def _update_job(self, job_id: str, fields: dict):
        """Convenience wrapper — fire-and-forget Firestore update."""
        ok = self.firestore.update_compile_job(job_id, fields)
        status = fields.get("status", "?")
        icon = "✓" if ok else "✗"
        print(f"[JobRunner] {icon} Firestore status → {status}")
