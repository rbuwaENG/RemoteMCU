# RemoteMCU Host Agent

The host-agent is a Python service that runs on the PC connected to your hardware device (Arduino, ESP32, STM32, etc.). It bridges your local USB/serial port to the RemoteMCU web dashboard.

## Quick Start

### Windows (Recommended)

1. Make sure **Python 3.10+** is installed and in your PATH
2. Double-click `install_windows.bat`
3. The installer will:
   - Install all Python dependencies
   - Create a `.env` configuration file
   - Add the agent to Windows Startup (auto-runs on login)
   - Launch the system tray icon immediately

4. Edit `host-agent/.env` with your credentials (shown in the dashboard during device onboarding)
5. Look for the **RemoteMCU circle icon** in your system tray

### macOS / Linux (Manual)

```bash
cd host-agent
pip install -r requirements.txt
python src/tray_app.py
```

To auto-start on login, add the command above to your system's startup applications.

---

## Running Modes

| Mode | Command | Best for |
|---|---|---|
| **System Tray** (recommended) | `python src/tray_app.py` | End users — shows live status icon |
| **Console** (debug) | `python src/host_agent.py` | Developers — shows all log output |
| **With setup token** | `python src/host_agent.py --token <token>` | First-time onboarding |

---

## System Tray Icon Colors

| Color | Status |
|---|---|
| 🔴 Red | Error — check logs |
| 🟡 Amber | Connecting to MQTT/Firebase |
| 🟢 Green | Connected and ready |
| 🔵 Blue | Flashing firmware |
| 🟣 Purple | Compiling sketch |
| ⚫ Gray | Agent stopped |

**Right-click the tray icon** to:
- Start / Stop / Restart the agent
- Enable or disable auto-start on Windows login
- Open the RemoteMCU dashboard in your browser
- View the agent log file

---

## Configuration (`.env`)

Copy `.env.example` to `.env` and fill in the values shown during device onboarding:

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_ID_TOKEN=<obtained-during-onboarding>
NEXT_PUBLIC_MQTT_BROKER_URL=wss://your-broker.hivemq.cloud:8884/mqtt
NEXT_PUBLIC_MQTT_USERNAME=your-mqtt-username
NEXT_PUBLIC_MQTT_PASSWORD=your-mqtt-password
DEVICE_ID=device-001
API_KEY=your-api-key
```

---

## Log Files

Logs are written to `host-agent/logs/agent.log` (auto-rotates at 5MB, keeps 3 backups).

---

## Requirements

- Python 3.10+
- `arduino-cli` (for compile & flash — install from https://arduino.github.io/arduino-cli/)
- USB drivers for your board (CP210x, CH340, etc.)
