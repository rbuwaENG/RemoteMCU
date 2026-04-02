# RemoteMCU Host Agent Build Script
# Run this to create distributable zip files for Windows, macOS, and Linux

import os
import zipfile
import tarfile
import shutil
from pathlib import Path

# Get the project root
script_dir = Path(__file__).parent
project_root = script_dir.parent
host_agent_dir = project_root / "host-agent"
output_dir = project_root / "dist"

def create_windows_zip():
    """Create Windows zip distribution"""
    output_name = output_dir / "remote-mcu-host-agent-win.zip"
    
    with zipfile.ZipFile(output_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add all files from host-agent
        for root, dirs, files in os.walk(host_agent_dir):
            for file in files:
                file_path = Path(root) / file
                # Keep the folder structure
                arcname = file_path.relative_to(host_agent_dir)
                zipf.write(file_path, arcname)
        
        # Add a quick start batch file
        quickstart = """@echo off
echo RemoteMCU Host Agent
echo.
echo Starting agent...
python src\\host_agent.py --token YOUR_TOKEN_HERE
pause
"""
        zipf.writestr("quick-start.bat", quickstart)
        
        # Add a config file template
        config_template = """# RemoteMCU Host Agent Configuration
# Copy this to config.py and fill in your values

TOKEN = "YOUR_TOKEN_HERE"
FIRESTORE_PROJECT = "your-project-id"
API_KEY = "your-api-key"

# Serial settings
SERIAL_BAUDRATE = 115200
SERIAL_TIMEOUT = 1

# MQTT settings (optional)
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
"""
        zipf.writestr("config.template", config_template)
    
    print(f"Created: {output_name}")
    return output_name

def create_macos_zip():
    """Create macOS zip distribution"""
    output_name = output_dir / "remote-mcu-host-agent-mac.zip"
    
    with zipfile.ZipFile(output_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(host_agent_dir):
            for file in files:
                file_path = Path(root) / file
                arcname = file_path.relative_to(host_agent_dir)
                zipf.write(file_path, arcname)
        
        # Add shell scripts
        quickstart = """#!/bin/bash
echo "RemoteMCU Host Agent"
echo ""
echo "Starting agent..."
python3 src/host_agent.py --token YOUR_TOKEN_HERE
"""
        zipf.writestr("quick-start.command", quickstart)
        
        config_template = """# RemoteMCU Host Agent Configuration
TOKEN = "YOUR_TOKEN_HERE"
FIRESTORE_PROJECT = "your-project-id"
SERIAL_BAUDRATE = 115200
"""
        zipf.writestr("config.template", config_template)
    
    print(f"Created: {output_name}")
    return output_name

def create_linux_tar():
    """Create Linux tar.gz distribution"""
    output_name = output_dir / "remote-mcu-host-agent-linux.tar.gz"
    
    with tarfile.open(output_name, 'w:gz') as tar:
        # Add host-agent folder
        tar.add(host_agent_dir, arcname="remote-mcu-host-agent")
        
        # Add quick start script
        quickstart = """#!/bin/bash
echo "RemoteMCU Host Agent"
echo "Starting agent..."
python3 src/host_agent.py --token YOUR_TOKEN_HERE
"""
        import io
        tarinfo = tarfile.TarInfo(name="remote-mcu-host-agent/quick-start.sh")
        tarinfo.size = len(quickstart)
        tar.addfile(tarinfo, io.BytesIO(quickstart.encode()))
        
        config_template = """# RemoteMCU Host Agent Configuration
TOKEN = "YOUR_TOKEN_HERE"
FIRESTORE_PROJECT = "your-project-id"
SERIAL_BAUDRATE = 115200
"""
        tarinfo = tarfile.TarInfo(name="remote-mcu-host-agent/config.template")
        tarinfo.size = len(config_template)
        tar.addfile(tarinfo, io.BytesIO(config_template.encode()))
    
    print(f"Created: {output_name}")
    return output_name

def main():
    # Create dist folder
    output_dir.mkdir(exist_ok=True)
    
    print("Building RemoteMCU Host Agent distributions...")
    print(f"Source: {host_agent_dir}")
    print(f"Output: {output_dir}")
    print()
    
    create_windows_zip()
    create_macos_zip()
    create_linux_tar()
    
    print()
    print("Build complete!")
    print(f"Files are in: {output_dir}")
    print()
    print("Next steps:")
    print("1. Upload these files to Firebase Storage (host-agent folder)")
    print("2. Or upload to GitHub releases")
    print("3. Update download page URLs if needed")

if __name__ == "__main__":
    main()
