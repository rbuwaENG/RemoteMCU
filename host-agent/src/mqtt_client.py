import json
import threading
import time
from typing import Callable, Optional
import paho.mqtt.client as mqtt
from config import MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD, DEVICE_ID, HEARTBEAT_INTERVAL


class MQTTClient:
    def __init__(self, device_id: str):
        self.device_id = device_id
        self.client = mqtt.Client(client_id=f"host-agent-{device_id}")
        
        if MQTT_USERNAME and MQTT_PASSWORD:
            self.client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        
        self.connected = False
        self.subscriptions: dict[str, Callable] = {}
        self.heartbeat_thread: Optional[threading.Thread] = None
        
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message

    def connect(self) -> bool:
        try:
            self.client.connect(
                MQTT_BROKER_URL.split("://")[1].split(":")[0],
                int(MQTT_BROKER_URL.split(":")[-1].split("/")[0]) if ":" in MQTT_BROKER_URL else 1883,
                60
            )
            self.client.loop_start()
            return True
        except Exception as e:
            print(f"MQTT connection failed: {e}")
            return False

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            print(f"MQTT connected to {MQTT_BROKER_URL}")
            
            self.subscribe(f"remotemcu/device/{self.device_id}/command")
            self.start_heartbeat()
        else:
            print(f"MQTT connection failed with code {rc}")

    def _on_disconnect(self, client, userdata, rc):
        self.connected = False
        print(f"MQTT disconnected (rc: {rc})")

    def _on_message(self, client, userdata, msg):
        topic = msg.topic
        payload = msg.payload.decode()
        
        if topic in self.subscriptions:
            try:
                data = json.loads(payload) if payload else {}
                self.subscriptions[topic](data)
            except json.JSONDecodeError:
                self.subscriptions[topic](payload)

    def subscribe(self, topic: str, callback: Optional[Callable] = None):
        self.client.subscribe(topic)
        
        if callback:
            self.subscriptions[topic] = callback
        else:
            self.subscriptions[topic] = lambda data: print(f"Received on {topic}: {data}")

    def publish(self, topic: str, payload: dict | str, retain: bool = False):
        if isinstance(payload, dict):
            payload = json.dumps(payload)
        
        self.client.publish(topic, payload, retain=retain)

    def send_status(self, status: str, details: dict = None):
        topic = f"remotemcu/device/{self.device_id}/status"
        payload = {
            "status": status,
            "timestamp": time.time(),
            **(details or {})
        }
        self.publish(topic, payload)

    def send_serial_data(self, data: str):
        topic = f"remotemcu/device/{self.device_id}/serial"
        self.publish(topic, {"data": data, "timestamp": time.time()})

    def send_flash_progress(self, progress: int, message: str = ""):
        topic = f"remotemcu/device/{self.device_id}/flash"
        self.publish(topic, {"progress": progress, "message": message, "timestamp": time.time()})

    def _heartbeat(self):
        while self.connected:
            self.send_status("online", {"heartbeat": True})
            time.sleep(HEARTBEAT_INTERVAL)

    def start_heartbeat(self):
        self.heartbeat_thread = threading.Thread(target=self._heartbeat, daemon=True)
        self.heartbeat_thread.start()

    def disconnect(self):
        self.send_status("offline")
        self.client.loop_stop()
        self.client.disconnect()
