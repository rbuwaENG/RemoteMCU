import serial
import threading
import time
from typing import Optional, Callable
from config import SERIAL_BAUDRATE, SERIAL_TIMEOUT


class SerialBridge:
    def __init__(self, port: str, baudrate: int = SERIAL_BAUDRATE, timeout: float = SERIAL_TIMEOUT):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial: Optional[serial.Serial] = None
        self.running = False
        self.read_thread: Optional[threading.Thread] = None
        self.on_data: Optional[Callable[[str], None]] = None

    def connect(self) -> bool:
        try:
            self.serial = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                timeout=self.timeout,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE
            )
            self.running = True
            self.read_thread = threading.Thread(target=self._read_loop, daemon=True)
            self.read_thread.start()
            return True
        except Exception as e:
            print(f"Serial connection failed: {e}")
            return False

    def disconnect(self):
        self.running = False
        if self.serial and self.serial.is_open:
            self.serial.close()

    def _read_loop(self):
        buffer = ""
        
        while self.running:
            try:
                if self.serial and self.serial.in_waiting > 0:
                    data = self.serial.read(self.serial.in_waiting)
                    buffer += data.decode("utf-8", errors="replace")
                    
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        if self.on_data:
                            self.on_data(line + "\n")
                
                time.sleep(0.01)
            except Exception as e:
                print(f"Serial read error: {e}")
                time.sleep(1)

    def write(self, data: str):
        if self.serial and self.serial.is_open:
            try:
                self.serial.write(data.encode("utf-8"))
            except Exception as e:
                print(f"Serial write error: {e}")

    def write_line(self, data: str):
        self.write(data + "\n")

    def is_connected(self) -> bool:
        return self.serial is not None and self.serial.is_open

    def available_ports(self):
        ports = serial.tools.list_ports.comports()
        return [{"port": p.device, "description": p.description} for p in ports]
