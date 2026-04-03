#!/bin/bash
echo "  ____                     _       __  __  ____ _   _ "
echo " |  _ \ ___ _ __ ___   ___| |_ ___|  \/  |/ ___| | | |"
echo " | |_) / _ \ '_ \` _ \ / _ \ __/ _ \ |\/| | |   | | | |"
echo " |  _ <  __/ | | | | | (_) | ||  __/ |  | | |___| |_| |"
echo " |_| \_\___|_| |_| |_|\___/ \__\___|_|  |_|\____|\___/ "
echo ""
echo "                   Host Agent Setup (Mac)"
echo ""
echo ""

# Check python3
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3."
    exit 1
fi

echo "[1/2] Installing dependencies..."
python3 -m pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies."
    exit 1
fi

echo ""
echo "[2/2] Creating start shortcut..."
cat << 'EOF' > "Start RemoteMCU.command"
#!/bin/bash
cd "$(dirname "$0")/src"
python3 tray_app.py
EOF

chmod +x "Start RemoteMCU.command"

echo "[OK] Setup complete!"
echo "Double-click 'Start RemoteMCU.command' to launch the agent."
echo ""
