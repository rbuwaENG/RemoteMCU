import os
import json
import signal
import sys
import threading
import time
from dotenv import load_dotenv

load_dotenv()

from config import DEVICE_ID, API_KEY
from mqtt_client import MQTTClient
from serial_bridge import SerialBridge
from flasher import Flasher
from board_detector import BoardDetector
from camera_capture import CameraCapture
from compiler import Compiler
from firestore_client import FirestoreClient
from job_runner import JobRunner
from share_key_handler import ShareKeyHandler


class HostAgent:
    def __init__(self, device_id: str):
        self.device_id = device_id
        self.mqtt = MQTTClient(device_id)
        self.serial: SerialBridge | None = None
        self.flasher = Flasher()
        self.camera: CameraCapture | None = None
        self.current_port: str | None = None
        self.running = False

        # ── New in Phase 12 ──────────────────────────────────────────────
        self.compiler = Compiler()
        self.firestore: FirestoreClient | None = None
        self.job_runner: JobRunner | None = None
        self._init_firestore()

    def _init_firestore(self):
        """Initialize the Firestore REST client from environment variables."""
        try:
            self.firestore = FirestoreClient.from_env()
            self.job_runner = JobRunner(
                firestore=self.firestore,
                compiler=self.compiler,
                flasher=self.flasher,
                device_id=self.device_id,
                mqtt_publish_fn=self.mqtt.publish,
            )
            print("[HostAgent] Firestore client initialised.")
        except ValueError as e:
            print(f"[HostAgent] WARNING: Firestore not configured — {e}")
            print("[HostAgent] Compile & Flash will not work until FIREBASE_PROJECT_ID is set.")
        self.share_key_handler = ShareKeyHandler(device_id, self.mqtt)
        
    def start(self):
        print(f"Starting Host Agent for device: {self.device_id}")
        
        if not self.mqtt.connect():
            print("Failed to connect to MQTT broker")
            return False
        
        self._setup_mqtt_handlers()
        self.mqtt.send_status("starting")

        # Report online status to Firestore
        if self.firestore:
            self.firestore.update_device_status(self.device_id, "online", {
                "agentVersion": "1.0.0",
                "compilerAvailable": self.compiler.is_available(),
            })
        
        self.running = True
        print("Host Agent started successfully")

        # Start heartbeat thread
        if self.firestore:
            threading.Thread(target=self._heartbeat_loop, daemon=True).start()
        
        while self.running:
            time.sleep(1)
        
        return True

    def _heartbeat_loop(self):
        """Send periodic heartbeats to Firestore"""
        while self.running:
            time.sleep(30)  # Update every 30 seconds
            if self.firestore:
                self.firestore.update_device_status(
                    self.device_id,
                    "online",
                    {"port": self.current_port}
                )

    def _setup_mqtt_handlers(self):
        self.mqtt.subscribe(f"remotemcu/device/{self.device_id}/command/serial", self._handle_serial_command)
        self.mqtt.subscribe(f"remotemcu/device/{self.device_id}/command/connect", self._handle_connect)
        self.mqtt.subscribe(f"remotemcu/device/{self.device_id}/command/disconnect", self._handle_disconnect)
        # Phase 12: replaced /command/flash with /command/compile
        self.mqtt.subscribe(f"remotemcu/device/{self.device_id}/command/compile", self._handle_compile)
        self.mqtt.subscribe(f"remotemcu/device/{self.device_id}/command/camera", self._handle_camera)
        self.mqtt.subscribe(f"remotemcu/device/{self.device_id}/command/detect", self._handle_detect)

    def _handle_connect(self, data):
        if isinstance(data, dict):
            port = data.get("port")
            
            if not port:
                self.mqtt.send_status("error", {"message": "Port not specified"})
                return
            
            self.current_port = port
            
            if self.serial:
                self.serial.disconnect()
            
            self.serial = SerialBridge(port)
            
            if self.serial.connect():
                self.serial.on_data = self._on_serial_data
                self.mqtt.send_status("connected", {"port": port})
            else:
                self.mqtt.send_status("error", {"message": f"Failed to connect to {port}"})

    def _handle_disconnect(self, data):
        if self.serial:
            self.serial.disconnect()
            self.serial = None
        self.current_port = None
        self.mqtt.send_status("disconnected")

    def _handle_serial_command(self, data):
        if not self.serial or not self.serial.is_connected():
            self.mqtt.send_status("error", {"message": "Not connected"})
            return
        
        if isinstance(data, dict):
            command = data.get("command", "")
            if command:
                self.serial.write_line(command)

    def _handle_compile(self, data):
        """
        Phase 12: Real compile + flash handler.

        Receives a jobId from MQTT. The job_runner fetches the actual sketch
        code from Firestore, compiles it locally with arduino-cli, then flashes
        the binary to the connected device. The compiled binary never leaves
        this machine.

        MQTT payload: { "jobId": "<firestore-document-id>" }
        """
        if not isinstance(data, dict):
            print("[HostAgent] _handle_compile: expected dict payload")
            return

        job_id = data.get("jobId")
        if not job_id:
            print("[HostAgent] _handle_compile: missing jobId in payload")
            return

        if not self.job_runner:
            print("[HostAgent] _handle_compile: Firestore not configured — cannot compile")
            self.mqtt.send_status("error", {"message": "Agent Firestore not configured"})
            return

        if not self.current_port:
            print(f"[HostAgent] _handle_compile: no serial port connected for job {job_id}")
            # Write the error back to Firestore so the browser sees it
            self.firestore.update_compile_job(job_id, {
                "status": "error",
                "errors": [{
                    "line": 0,
                    "column": 0,
                    "type": "error",
                    "message": (
                        "No hardware device is connected to the agent. "
                        "Please connect a device via the dashboard first."
                    ),
                }],
            })
            return

        print(f"[HostAgent] Compile job received: {job_id} (port: {self.current_port})")
        started = self.job_runner.run_async(job_id, self.current_port)

        if not started:
            self.firestore.update_compile_job(job_id, {
                "status": "error",
                "errors": [{
                    "line": 0,
                    "column": 0,
                    "type": "error",
                    "message": "Agent is busy with another compile job. Please wait and try again.",
                }],
            })


    def _handle_camera(self, data):
        if not isinstance(data, dict):
            return
        
        action = data.get("action", "start")
        
        if action == "start":
            camera_index = data.get("camera", 0)
            
            if self.camera and self.camera.is_running():
                self.camera.stop()
            
            self.camera = CameraCapture(camera_index)
            
            def frame_callback(base64_frame: str):
                self.mqtt.publish(
                    f"remotemcu/device/{self.device_id}/camera",
                    {"frame": base64_frame, "timestamp": time.time()}
                )
            
            self.camera.on_frame = frame_callback
            
            if self.camera.start():
                self.mqtt.send_status("camera_on", {"camera": camera_index})
            else:
                self.mqtt.send_status("error", {"message": "Failed to start camera"})
        
        elif action == "stop":
            if self.camera:
                self.camera.stop()
                self.camera = None
            self.mqtt.send_status("camera_off")

    def _handle_detect(self, data):
        ports = self.serial.available_ports() if self.serial else []
        detected = []
        
        for port_info in ports:
            port = port_info["port"]
            board = BoardDetector.auto_detect(port)
            
            if board:
                detected.append({"port": port, "board": board})
        
        self.mqtt.publish(
            f"remotemcu/device/{self.device_id}/detected",
            {"ports": detected, "timestamp": time.time()}
        )

    def _on_serial_data(self, data: str):
        self.mqtt.send_serial_data(data)

    def stop(self):
        self.running = False
        
        if self.serial:
            self.serial.disconnect()
        
        if self.camera:
            self.camera.stop()
        
        # Report offline status to Firestore before disconnecting MQTT
        if self.firestore:
            self.firestore.update_device_status(self.device_id, "offline")

        self.mqtt.send_status("offline")
        self.mqtt.disconnect()
        
        print("Host Agent stopped")


def main():
    device_id = os.getenv("DEVICE_ID", "test-device")
    api_key = os.getenv("API_KEY", "")
    
    agent = HostAgent(device_id)
    
    def signal_handler(sig, frame):
        print("\nShutting down...")
        agent.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    agent.start()


if __name__ == "__main__":
    main()
