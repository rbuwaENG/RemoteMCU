import threading
import time
import base64
from typing import Optional, Callable
import cv2


class CameraCapture:
    def __init__(self, camera_index: int = 0):
        self.camera_index = camera_index
        self.cap: Optional[cv2.VideoCapture] = None
        self.running = False
        self.capture_thread: Optional[threading.Thread] = None
        self.on_frame: Optional[Callable[[str], None]] = None
        self.frame_interval = 1.0

    def start(self) -> bool:
        try:
            self.cap = cv2.VideoCapture(self.camera_index)
            
            if not self.cap.isOpened():
                print(f"Failed to open camera {self.camera_index}")
                return False
            
            self.running = True
            self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
            self.capture_thread.start()
            return True
        except Exception as e:
            print(f"Camera start failed: {e}")
            return False

    def stop(self):
        self.running = False
        
        if self.capture_thread:
            self.capture_thread.join(timeout=2)
        
        if self.cap:
            self.cap.release()
            self.cap = None

    def _capture_loop(self):
        while self.running:
            try:
                if self.cap and self.cap.isOpened():
                    ret, frame = self.cap.read()
                    
                    if ret:
                        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                        base64_frame = base64.b64encode(buffer).decode("utf-8")
                        
                        if self.on_frame:
                            self.on_frame(base64_frame)
                
                time.sleep(self.frame_interval)
            except Exception as e:
                print(f"Capture error: {e}")
                time.sleep(1)

    def set_interval(self, seconds: float):
        self.frame_interval = max(0.1, seconds)

    def is_running(self) -> bool:
        return self.running and self.cap is not None
