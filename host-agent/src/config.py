import os
from dotenv import load_dotenv

load_dotenv()

MQTT_BROKER_URL = os.getenv("MQTT_BROKER_URL", "wss://broker.hivemq.cloud:8884/mqtt")
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "")
DEVICE_ID = os.getenv("DEVICE_ID", "")
API_KEY = os.getenv("API_KEY", "")

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
