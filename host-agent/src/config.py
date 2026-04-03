import os
import json
from pathlib import Path
from constants import FIREBASE_PROJECT_ID, FIREBASE_API_KEY, MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD
from dotenv import load_dotenv

# Try to load .env as a fallback (for developers)
load_dotenv()

# Config file location: ~/.remotemcu/device.json
CONFIG_FILE = Path.home() / ".remotemcu" / "device.json"

# Deobfuscated or environment-based constants
PROJECT_ID = FIREBASE_PROJECT_ID or os.getenv("FIREBASE_PROJECT_ID", "")
API_KEY = FIREBASE_API_KEY or os.getenv("FIREBASE_API_KEY", "")
MQTT_URL = MQTT_BROKER_URL or os.getenv("MQTT_BROKER_URL", "wss://broker.hivemq.cloud:8884/mqtt")
MQTT_USER = MQTT_USERNAME or os.getenv("MQTT_USERNAME", "")
MQTT_PASS = MQTT_PASSWORD or os.getenv("MQTT_PASSWORD", "")

# Load Device ID from local storage or environment
DEVICE_ID = ""
if CONFIG_FILE.exists():
    try:
        with open(CONFIG_FILE, "r") as f:
            _conf = json.load(f)
            DEVICE_ID = _conf.get("device_id", "")
            print(f"[Config] Loaded DEVICE_ID from {CONFIG_FILE}")
    except Exception as e:
        print(f"[Config] Error reading {CONFIG_FILE}: {e}")

if not DEVICE_ID:
    _env_id = os.getenv("DEVICE_ID", "")
    # Ignore placeholder IDs from old .env files
    if _env_id and _env_id != "device-001":
        DEVICE_ID = _env_id

# Internal settings
SERIAL_BAUDRATE = 115200
SERIAL_TIMEOUT = 1
HEARTBEAT_INTERVAL = 30

BOARD_DEFINITIONS = {
    "esp32": {
        "flasher": "esptool",
        "args": ["--chip", "esp32", "--port", "{port}", "--baud", "921600", "write_flash", "0x1000", "{bin}"]
    },
    "esp8266": {
        "flasher": "esptool",
        "args": ["--chip", "esp8266", "--port", "{port}", "--baud", "115200", "write_flash", "0x0", "{bin}"]
    },
    "arduino-uno": {
        "flasher": "avrdude",
        "args": ["-p", "atmega328p", "-P", "{port}", "-c", "arduino", "-U", "flash:w:{bin}:i"]
    },
    "arduino-nano": {
        "flasher": "avrdude",
        "args": ["-p", "m328p", "-P", "{port}", "-c", "arduino", "-U", "flash:w:{bin}:i"]
    },
}
