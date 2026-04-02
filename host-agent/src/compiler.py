"""
compiler.py — Wraps arduino-cli to compile Arduino sketches locally.

Returns structured errors with exact line/column numbers so the browser
can render Monaco editor squiggles at the right positions.
"""

import os
import re
import subprocess
import tempfile
import time
from typing import Optional


# Maps RemoteMCU board identifiers → arduino-cli Fully Qualified Board Names
FQBN_MAP: dict[str, str] = {
    "esp32":             "esp32:esp32:esp32",
    "esp8266":           "esp8266:esp8266:generic",
    "arduino-uno":       "arduino:avr:uno",
    "arduino-nano":      "arduino:avr:nano",
    "arduino-nano-new":  "arduino:avr:nano:cpu=atmega328new",
    "stm32":             "STMicroelectronics:stm32:GenF4",
    "raspberry-pi-pico": "rp2040:rp2040:rpipico",
    "arduino-mega":      "arduino:avr:mega",
    "arduino-leonardo":  "arduino:avr:leonardo",
}

# arduino-cli error/warning line format:
#   sketch.ino:LINE:COL: error: MESSAGE
#   sketch.ino:LINE:COL: warning: MESSAGE
_DIAGNOSTIC_PATTERN = re.compile(
    r"sketch\.ino:(\d+):(\d+):\s+(error|warning|note):\s+(.+)"
)

# Binary file extensions produced by arduino-cli
_BINARY_EXTENSIONS = (".bin", ".hex", ".elf")


class CompileResult:
    """Structured result from a compile operation."""

    def __init__(
        self,
        success: bool,
        errors: list[dict],
        warnings: list[dict],
        raw_output: str,
        duration_ms: int,
        binary_path: Optional[str] = None,
        binary_size: Optional[int] = None,
    ):
        self.success = success
        self.errors = errors
        self.warnings = warnings
        self.raw_output = raw_output
        self.duration_ms = duration_ms
        self.binary_path = binary_path
        self.binary_size = binary_size

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "errors": self.errors,
            "warnings": self.warnings,
            "rawOutput": self.raw_output,
            "durationMs": self.duration_ms,
            "binaryPath": self.binary_path,
            "binarySize": self.binary_size,
        }


class Compiler:
    """
    Compiles Arduino sketches using arduino-cli installed on the host machine.

    Usage:
        compiler = Compiler()
        result = compiler.compile("esp32", "void setup() {...} void loop(){}")
        if result.success:
            flash(result.binary_path)
        else:
            for err in result.errors:
                print(err["line"], err["message"])
    """

    def __init__(self, arduino_cli_path: str = "arduino-cli"):
        self.arduino_cli_path = arduino_cli_path
        self._check_installation()

    def _check_installation(self) -> bool:
        """Verify arduino-cli is available on this machine."""
        try:
            result = subprocess.run(
                [self.arduino_cli_path, "version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                print(f"[Compiler] arduino-cli found: {result.stdout.strip()}")
                return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass

        print(
            "[Compiler] WARNING: arduino-cli not found. "
            "Install it from https://arduino.github.io/arduino-cli/latest/installation/"
        )
        return False

    def is_available(self) -> bool:
        """Return True if arduino-cli is installed and accessible."""
        try:
            result = subprocess.run(
                [self.arduino_cli_path, "version"],
                capture_output=True,
                timeout=5,
            )
            return result.returncode == 0
        except Exception:
            return False

    def get_fqbn(self, board: str) -> Optional[str]:
        """Look up the FQBN for a board identifier. Returns None if unknown."""
        return FQBN_MAP.get(board.lower())

    def compile(self, board: str, code: str) -> CompileResult:
        """
        Compile the given Arduino sketch code for the specified board.

        Args:
            board: RemoteMCU board identifier (e.g. "esp32", "arduino-uno")
            code:  Full Arduino sketch source code as a string

        Returns:
            CompileResult with success flag, errors, warnings, binary path
        """
        fqbn = self.get_fqbn(board)
        if not fqbn:
            return CompileResult(
                success=False,
                errors=[{
                    "line": 0,
                    "column": 0,
                    "type": "error",
                    "message": f"Unknown board type: '{board}'. Supported boards: {', '.join(FQBN_MAP.keys())}",
                }],
                warnings=[],
                raw_output="",
                duration_ms=0,
            )

        if not self.is_available():
            return CompileResult(
                success=False,
                errors=[{
                    "line": 0,
                    "column": 0,
                    "type": "error",
                    "message": (
                        "arduino-cli is not installed on this machine. "
                        "Please install it to enable compilation."
                    ),
                }],
                warnings=[],
                raw_output="",
                duration_ms=0,
            )

        # Use a temporary directory so we get a clean compile environment
        # The directory (and binary) is cleaned up by the caller (job_runner)
        # after the flash completes.
        with tempfile.TemporaryDirectory() as tmpdir:
            return self._run_compile(fqbn, code, tmpdir)

    def compile_to_dir(self, board: str, code: str, output_dir: str) -> CompileResult:
        """
        Like compile() but saves the binary to a persistent directory.
        The caller is responsible for cleaning up output_dir.
        """
        fqbn = self.get_fqbn(board)
        if not fqbn:
            return CompileResult(
                success=False,
                errors=[{"line": 0, "column": 0, "type": "error",
                          "message": f"Unknown board: {board}"}],
                warnings=[], raw_output="", duration_ms=0,
            )
        return self._run_compile(fqbn, code, output_dir)

    def _run_compile(self, fqbn: str, code: str, output_dir: str) -> CompileResult:
        """Internal: write sketch, invoke arduino-cli, parse output."""
        # arduino-cli requires the sketch file to be inside a folder
        # with the same name as the .ino file
        sketch_dir = os.path.join(output_dir, "sketch")
        os.makedirs(sketch_dir, exist_ok=True)
        sketch_file = os.path.join(sketch_dir, "sketch.ino")

        with open(sketch_file, "w", encoding="utf-8") as f:
            f.write(code)

        cmd = [
            self.arduino_cli_path,
            "compile",
            "--fqbn", fqbn,
            "--output-dir", output_dir,
            "--log-level", "error",
            sketch_dir,
        ]

        print(f"[Compiler] Running: {' '.join(cmd)}")
        start = time.monotonic()

        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=180,  # 3 minutes max — large libraries can be slow
            )
        except subprocess.TimeoutExpired:
            return CompileResult(
                success=False,
                errors=[{"line": 0, "column": 0, "type": "error",
                          "message": "Compilation timed out after 3 minutes."}],
                warnings=[], raw_output="Compilation timed out.", duration_ms=180_000,
            )
        except Exception as e:
            return CompileResult(
                success=False,
                errors=[{"line": 0, "column": 0, "type": "error",
                          "message": f"Failed to launch arduino-cli: {e}"}],
                warnings=[], raw_output=str(e), duration_ms=0,
            )

        duration_ms = int((time.monotonic() - start) * 1000)
        raw = (proc.stdout or "") + (proc.stderr or "")

        errors, warnings = self._parse_diagnostics(raw)

        # Find the compiled binary in the output directory
        binary_path, binary_size = self._find_binary(output_dir)

        success = proc.returncode == 0
        print(
            f"[Compiler] {'Success' if success else 'Failed'} "
            f"in {duration_ms}ms — {len(errors)} errors, {len(warnings)} warnings"
        )

        return CompileResult(
            success=success,
            errors=errors,
            warnings=warnings,
            raw_output=raw,
            duration_ms=duration_ms,
            binary_path=binary_path,
            binary_size=binary_size,
        )

    def _parse_diagnostics(self, raw: str) -> tuple[list[dict], list[dict]]:
        """
        Parse arduino-cli stderr output into structured error and warning dicts.

        arduino-cli diagnostic format:
            /path/to/sketch.ino:LINE:COL: error: MESSAGE
            /path/to/sketch.ino:LINE:COL:   MESSAGE (continuation)
        """
        errors: list[dict] = []
        warnings: list[dict] = []

        for match in _DIAGNOSTIC_PATTERN.finditer(raw):
            line_no = int(match.group(1))
            col_no = int(match.group(2))
            severity = match.group(3)
            message = match.group(4).strip()

            # Skip unhelpful "note:" diagnostics
            if severity == "note":
                continue

            entry = {
                "line": line_no,
                "column": col_no,
                "type": severity,
                "message": message,
            }

            if severity == "error":
                errors.append(entry)
            else:
                warnings.append(entry)

        return errors, warnings

    def _find_binary(self, output_dir: str) -> tuple[Optional[str], Optional[int]]:
        """Find the compiled binary file in the output directory."""
        if not os.path.isdir(output_dir):
            return None, None

        # Prefer .bin for ESP boards, .hex for AVR
        preferred = [".bin", ".hex", ".elf"]
        found: list[tuple[str, int]] = []

        for fname in os.listdir(output_dir):
            if any(fname.endswith(ext) for ext in preferred):
                fpath = os.path.join(output_dir, fname)
                if os.path.isfile(fpath):
                    found.append((fpath, os.path.getsize(fpath)))

        if not found:
            return None, None

        # Sort by extension preference
        def sort_key(item: tuple[str, int]) -> int:
            path = item[0]
            for i, ext in enumerate(preferred):
                if path.endswith(ext):
                    return i
            return 99

        found.sort(key=sort_key)
        path, size = found[0]
        return path, size
