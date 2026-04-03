import json
import os
import sys
from pathlib import Path
from constants import FIREBASE_PROJECT_ID, FIREBASE_API_KEY
from firestore_client import FirestoreClient

# Config file location: ~/.remotemcu/device.json
CONFIG_DIR = Path.home() / ".remotemcu"
CONFIG_FILE = CONFIG_DIR / "device.json"

def is_configured():
    """Check if the agent has a valid device identification."""
    return CONFIG_FILE.exists()

def save_config(device_data):
    """Save the device configuration to local storage."""
    CONFIG_DIR.mkdir(exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump({
            "device_id": device_data.get("id"),
            "device_name": device_data.get("name"),
            "owner_id": device_data.get("ownerId"),
            "board": device_data.get("board"),
            "setup_token": device_data.get("setupToken"),
        }, f, indent=4)
    print(f"[Wizard] Configuration saved to {CONFIG_FILE}")

def run_setup_cli():
    """Run a simple command-line setup wizard."""
    print("\n" + "="*40)
    print("      RemoteMCU Host Agent Setup")
    print("="*40)
    print("\nTo link this agent, you need a Setup Token.")
    print("Get it from your RemoteMCU Dashboard -> Devices -> Add/Setup Device.")
    
    token = input("\nEnter Setup Token (e.g. RMCU-XXXX): ").strip()
    if not token:
        print("[Error] Token is required.")
        return False
    
    return perform_setup(token)

def perform_setup(token):
    """Fetch device details using the token and save config."""
    print(f"[Wizard] Validating token '{token}'...")
    
    # We use a FirestoreClient with the public API Key
    client = FirestoreClient(FIREBASE_PROJECT_ID, id_token="", api_key=FIREBASE_API_KEY)
    
    try:
        device_data = client.validate_setup_token(token)
        if not device_data:
            print("[Error] Invalid or expired setup token.")
            return False
        
        print(f"[Wizard] Linked to device: {device_data.get('name')} ({device_data.get('board')})")
        save_config(device_data)
        return True
    except Exception as e:
        print(f"[Error] Setup failed: {e}")
        return False

def run_setup_gui():
    """Run a simple Tkinter-based setup wizard for Windows/macOS."""
    try:
        import tkinter as tk
        from tkinter import messagebox
    except ImportError:
        return run_setup_cli()
    
    root = tk.Tk()
    root.title("RemoteMCU Setup Wizard")
    root.geometry("400x250")
    root.resizable(False, False)
    
    # Styling
    bg_color = "#121212"
    fg_color = "#FFFFFF"
    accent_color = "#67d7dd"
    
    root.configure(bg=bg_color)
    
    tk.Label(root, text="RemoteMCU", font=("Arial", 18, "bold"), bg=bg_color, fg=accent_color).pack(pady=10)
    tk.Label(root, text="Enter the Setup Token from your dashboard:", bg=bg_color, fg=fg_color).pack()
    
    entry = tk.Entry(root, font=("Courier New", 14), width=15, justify='center')
    entry.pack(pady=15)
    entry.insert(0, "RMCU-")
    
    status_label = tk.Label(root, text="", bg=bg_color, fg=fg_color, font=("Arial", 9))
    status_label.pack()

    def on_submit():
        token = entry.get().strip()
        if not token or token == "RMCU-":
            messagebox.showerror("Error", "Please enter a valid setup token.")
            return
        
        status_label.config(text="Validating token...", fg=accent_color)
        root.update()
        
        if perform_setup(token):
            messagebox.showinfo("Success", "Device linked successfully! The agent will now start.")
            root.destroy()
        else:
            status_label.config(text="Invalid or expired token.", fg="#ef4444")

    tk.Button(
        root, text="LINK DEVICE", command=on_submit, 
        bg=accent_color, fg="#003739", font=("Arial", 10, "bold"),
        padx=20, pady=5, relief='flat'
    ).pack(pady=10)
    
    # Bring to front on Windows
    root.attributes('-topmost', True)
    root.update()
    root.attributes('-topmost', False)
    root.lift()
    
    root.mainloop()
    return is_configured()

if __name__ == "__main__":
    if "--force" in sys.argv or not is_configured():
        run_setup_gui()
    else:
        print("[Wizard] Agent is already configured.")
