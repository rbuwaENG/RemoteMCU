import subprocess
import threading
import time
from typing import Optional, Callable
from config import BOARD_DEFINITIONS


class Flasher:
    def __init__(self):
        self.current_process: Optional[subprocess.Popen] = None
        self.on_progress: Optional[Callable[[int, str], None]] = None

    def flash(self, board_type: str, port: str, firmware_path: str, progress_callback: Optional[Callable[[int, str], None]] = None) -> bool:
        if board_type not in BOARD_DEFINITIONS:
            print(f"Unknown board type: {board_type}")
            return False

        self.on_progress = progress_callback
        board_config = BOARD_DEFINITIONS[board_type]
        flasher = board_config["flasher"]
        
        args = [arg.format(port=port, bin=firmware_path) for arg in board_config["args"]]
        
        self._send_progress(0, "Starting flash process...")
        
        thread = threading.Thread(target=self._run_flasher, args=(flasher, args), daemon=True)
        thread.start()
        
        return True

    def _run_flasher(self, flasher: str, args: list[str]):
        try:
            if flasher == "esptool":
                self._flash_esptool(args)
            elif flasher == "avrdude":
                self._flash_avrdude(args)
            
            self._send_progress(100, "Flash completed successfully!")
            
        except Exception as e:
            self._send_progress(-1, f"Flash failed: {str(e)}")

    def _flash_esptool(self, args: list[str]):
        cmd = ["python", "-m", "esptool"] + args
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        for line in process.stdout:
            print(f"esptool: {line.rstrip()}")
            
            if "Hashing data" in line:
                self._send_progress(20, "Preparing firmware...")
            elif "Enabling default flash" in line:
                self._send_progress(40, "Configuring flash...")
            elif "Wrote" in line:
                self._send_progress(60, "Writing firmware...")
            elif "Reading" in line:
                self._send_progress(80, "Verifying...")
        
        process.wait()
        
        if process.returncode != 0:
            raise Exception(f"esptool failed with code {process.returncode}")

    def _flash_avrdude(self, args: list[str]):
        cmd = ["avrdude"] + args
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        for line in process.stdout:
            print(f"avrdude: {line.rstrip()}")
            
            if "Writing" in line:
                self._send_progress(30, "Writing flash...")
            elif "Reading" in line:
                self._send_progress(70, "Verifying...")
        
        process.wait()
        
        if process.returncode != 0:
            raise Exception(f"avrdude failed with code {process.returncode}")

    def _send_progress(self, progress: int, message: str):
        if self.on_progress:
            self.on_progress(progress, message)

    def cancel(self):
        if self.current_process:
            self.current_process.terminate()
