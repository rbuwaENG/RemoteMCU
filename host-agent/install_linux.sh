#!/bin/bash
echo "  ____                     _       __  __  ____ _   _ "
echo " |  _ \ ___ _ __ ___   ___| |_ ___|  \/  |/ ___| | | |"
echo " | |_) / _ \ '_ \` _ \ / _ \ __/ _ \ |\/| | |   | | | |"
echo " |  _ <  __/ | | | | | (_) | ||  __/ |  | | |___| |_| |"
echo " |_| \_\___|_| |_| |_|\___/ \__\___|_|  |_|\____|\___/ "
echo ""
echo "                   Host Agent Setup (Linux)"
echo ""
echo ""

# Check python3
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3."
    exit 1
fi

echo "[1/2] Installing dependencies..."
# Try local installation first, some distros require --break-system-packages if using pip outside venv.
python3 -m pip install -r requirements.txt --break-system-packages 2>/dev/null || python3 -m pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies. You may need python3-pip or python3-venv installed."
    echo "Try running: sudo apt install python3-pip python3-tk"
    exit 1
fi

echo ""
echo "[2/2] Creating desktop launcher..."
DESKTOP_DIR="$HOME/.local/share/applications"
DESKTOP_FILE="$DESKTOP_DIR/remotemcu-agent.desktop"
mkdir -p "$DESKTOP_DIR"

cat << EOF > "$DESKTOP_FILE"
[Desktop Entry]
Name=RemoteMCU Agent
Comment=Background host agent for RemoteMCU
Exec=sh -c "cd '$(pwd)/src' && python3 tray_app.py"
Terminal=false
Type=Application
Categories=Utility;HardwareSettings;
Keywords=Arduino;ESP32;Hardware;
EOF

chmod +x "$DESKTOP_FILE"

cat << 'EOF' > "start.sh"
#!/bin/bash
cd "$(dirname "$0")/src"
python3 tray_app.py
EOF
chmod +x start.sh

echo "[OK] Setup complete!"
echo "You can now launch 'RemoteMCU Agent' from your application menu,"
echo "or run ./start.sh directly in the terminal."
echo ""
