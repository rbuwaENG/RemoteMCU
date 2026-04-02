import subprocess
import re
from typing import Optional


class BoardDetector:
    @staticmethod
    def detect_esp32(port: str) -> Optional[str]:
        try:
            result = subprocess.run(
                ["python", "-m", "esptool", "--port", port, "chip_id"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if "ESP32" in result.stdout or "ESP32" in result.stderr:
                return "esp32"
        except Exception:
            pass
        return None

    @staticmethod
    def detect_esp8266(port: str) -> Optional[str]:
        try:
            result = subprocess.run(
                ["python", "-m", "esptool", "--port", port, "chip_id"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if "ESP8266" in result.stdout or "ESP8266" in result.stderr:
                return "esp8266"
        except Exception:
            pass
        return None

    @staticmethod
    def detect_arduino(port: str) -> Optional[str]:
        try:
            result = subprocess.run(
                ["avrdude", "-P", port, "-c", "arduino", "-n"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if "atmega328p" in result.stdout or "atmega328p" in result.stderr:
                return "arduino-uno"
            elif "m328p" in result.stdout or "m328p" in result.stderr:
                return "arduino-nano"
        except Exception:
            pass
        return None

    @staticmethod
    def auto_detect(port: str) -> Optional[str]:
        detectors = [
            BoardDetector.detect_esp32,
            BoardDetector.detect_esp8266,
            BoardDetector.detect_arduino,
        ]
        
        for detector in detectors:
            result = detector(port)
            if result:
                return result
        
        return None
