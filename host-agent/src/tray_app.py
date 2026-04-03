"""
tray_app.py — RemoteMCU System Tray Application

Runs the host-agent in the background and shows a system tray icon that
reflects the current connection state. Users can:
  - See at a glance whether the agent is running and connected
  - Start / Stop the agent from the tray menu
  - Open the RemoteMCU dashboard in their browser
  - Enable / Disable auto-start on Windows login
  - Quit entirely

This is the recommended entry point for end users on Windows/macOS/Linux.
Instead of running `python host_agent.py`, they run `python tray_app.py`
(or double-click RemoteMCU.exe if packaged with PyInstaller).
"""

import os
import sys
import threading
import webbrowser
import subprocess
import time
from pathlib import Path
from typing import Optional

# Add the src directory to path so we can import agent modules
SRC_DIR = Path(__file__).parent
sys.path.insert(0, str(SRC_DIR))

try:
    import pystray
    from PIL import Image, ImageDraw
except ImportError:
    print("Missing dependencies. Run: pip install pystray pillow")
    sys.exit(1)

from dotenv import load_dotenv
load_dotenv()

from setup_wizard import is_configured, run_setup_gui

# ── Constants ──────────────────────────────────────────────────────────────────
APP_NAME = "RemoteMCU"
DASHBOARD_URL = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3001")
AUTOSTART_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
AUTOSTART_VALUE = "RemoteMCU Host Agent"

# ── Tray icon colors ───────────────────────────────────────────────────────────
COLORS = {
    "idle":        "#6B7280",   # Gray  — agent stopped
    "connecting":  "#F59E0B",   # Amber — connecting to MQTT/Firestore
    "online":      "#10B981",   # Green — connected and ready
    "flashing":    "#3B82F6",   # Blue  — currently flashing firmware
    "error":       "#EF4444",   # Red   — error state
    "compiling":   "#8B5CF6",   # Purple — compiling
}

STATUS_LABELS = {
    "idle":       "Agent Stopped",
    "connecting": "Connecting…",
    "online":     "Connected & Ready",
    "flashing":   "Flashing Firmware…",
    "compiling":  "Compiling…",
    "error":      "Error — Check Logs",
}


def _make_icon(color_hex: str, size: int = 64) -> Image.Image:
    """
    Generate a tray icon image.
    The icon is a filled circle on a transparent background.
    The color reflects the current agent state.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outer circle (background glow)
    padding = 4
    draw.ellipse(
        [padding, padding, size - padding, size - padding],
        fill=color_hex + "40",  # 25% opacity glow
    )

    # Inner filled circle
    inner_padding = 10
    draw.ellipse(
        [inner_padding, inner_padding, size - inner_padding, size - inner_padding],
        fill=color_hex,
    )

    # Small 'R' letter in white
    try:
        draw.text(
            (size // 2, size // 2),
            "R",
            fill="white",
            anchor="mm",
        )
    except Exception:
        pass  # Text rendering optional

    return img


class RemoteMCUTrayApp:
    """
    System tray application that manages the host-agent lifecycle.
    
    The agent runs inside a daemon thread. The tray icon reflects
    agent state updates published via a simple callback system.
    """

    def __init__(self):
        self._status = "idle"
        self._agent_thread: Optional[threading.Thread] = None
        self._agent: Optional[object] = None  # HostAgent instance
        self._tray: Optional[pystray.Icon] = None
        self._device_port: Optional[str] = None
        self._device_name: Optional[str] = None

    # ── Agent lifecycle ─────────────────────────────────────────────────────

    def _start_agent(self):
        """Import and start the HostAgent in a background thread."""
        if self._agent_thread and self._agent_thread.is_alive():
            print("[Tray] Agent is already running")
            return

        self._set_status("connecting")

        def _run():
            try:
                # Import here so startup is fast even if modules are heavy
                from host_agent import HostAgent
                from config import DEVICE_ID
                
                # Check config
                if not is_configured():
                    print("[Tray] Device not configured. Please use 'Setup Device' from the menu.")
                    self._set_status("idle")
                    return

                # Ensure DEVICE_ID is freshly loaded if setup just ran from menu
                import importlib
                import config
                importlib.reload(config)
                from config import DEVICE_ID

                self._agent = HostAgent(DEVICE_ID)

                # Monkey-patch the status callback so the tray icon updates
                original_send_status = self._agent.mqtt.send_status

                def patched_send_status(status: str, details: dict = None):
                    original_send_status(status, details)
                    if status == "online":
                        self._set_status("online")
                    elif status == "offline" or status == "error":
                        self._set_status("idle")

                self._agent.mqtt.send_status = patched_send_status

                self._set_status("online")
                self._agent.start()  # Blocks until agent.stop() is called

            except Exception as e:
                print(f"[Tray] Agent crashed: {e}")
                self._set_status("error")
                self._agent = None

        self._agent_thread = threading.Thread(
            target=_run,
            name="host-agent",
            daemon=True,
        )
        self._agent_thread.start()
        self._update_menu()

    def _stop_agent(self):
        """Gracefully stop the host-agent."""
        if self._agent:
            try:
                self._agent.stop()
            except Exception as e:
                print(f"[Tray] Error stopping agent: {e}")
            self._agent = None

        self._set_status("idle")
        self._update_menu()

    def _restart_agent(self):
        """Stop then restart the agent."""
        self._stop_agent()
        time.sleep(1)
        self._start_agent()

    # ── Status updates ─────────────────────────────────────────────────────

    def _set_status(self, status: str):
        """Update the tray icon color and tooltip to reflect current state."""
        self._status = status
        if self._tray:
            color = COLORS.get(status, COLORS["idle"])
            label = STATUS_LABELS.get(status, status)
            self._tray.icon = _make_icon(color)
            self._tray.title = f"{APP_NAME} — {label}"

    # ── Windows auto-start ─────────────────────────────────────────────────

    def _is_autostart_enabled(self) -> bool:
        """Check if RemoteMCU is registered in Windows startup."""
        if sys.platform != "win32":
            return False
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, AUTOSTART_KEY) as key:
                winreg.QueryValueEx(key, AUTOSTART_VALUE)
                return True
        except (FileNotFoundError, OSError):
            return False

    def _enable_autostart(self):
        """Register this script to run on Windows login."""
        if sys.platform != "win32":
            print("[Tray] Auto-start is only supported on Windows in this version.")
            return

        try:
            import winreg
            # Use the .exe if packaged, otherwise pythonw.exe (no console window)
            exe = sys.executable
            script = str(Path(__file__).resolve())

            if exe.endswith("python.exe"):
                exe = exe.replace("python.exe", "pythonw.exe")

            cmd = f'"{exe}" "{script}"'

            with winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                AUTOSTART_KEY,
                0,
                winreg.KEY_SET_VALUE,
            ) as key:
                winreg.SetValueEx(key, AUTOSTART_VALUE, 0, winreg.REG_SZ, cmd)
            print(f"[Tray] Auto-start enabled: {cmd}")
            self._update_menu()
        except Exception as e:
            print(f"[Tray] Failed to enable auto-start: {e}")

    def _disable_autostart(self):
        """Remove RemoteMCU from Windows startup."""
        if sys.platform != "win32":
            return
        try:
            import winreg
            with winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                AUTOSTART_KEY,
                0,
                winreg.KEY_SET_VALUE,
            ) as key:
                winreg.DeleteValue(key, AUTOSTART_VALUE)
            print("[Tray] Auto-start disabled")
            self._update_menu()
        except Exception as e:
            print(f"[Tray] Failed to disable auto-start: {e}")

    # ── Menu construction ──────────────────────────────────────────────────

    def _build_menu(self) -> pystray.Menu:
        """Build the right-click context menu for the tray icon."""
        is_running = (
            self._agent_thread is not None
            and self._agent_thread.is_alive()
        )
        autostart = self._is_autostart_enabled()

        items = [
            # Status header (non-clickable)
            pystray.MenuItem(
                f"Status: {STATUS_LABELS.get(self._status, self._status)}",
                None,
                enabled=False,
            ),
        ]

        # Device info if connected
        if self._device_port:
            items.append(
                pystray.MenuItem(
                    f"Port: {self._device_port}",
                    None,
                    enabled=False,
                )
            )

        items.append(pystray.Menu.SEPARATOR)

        # Start / Stop / Restart
        if is_running:
            items += [
                pystray.MenuItem("⏹  Stop Agent", lambda _: self._stop_agent()),
                pystray.MenuItem("🔄 Restart Agent", lambda _: self._restart_agent()),
            ]
        else:
            items.append(
                pystray.MenuItem("▶  Start Agent", lambda _: self._start_agent())
            )

        items.append(pystray.Menu.SEPARATOR)

        # Auto-start toggle
        if sys.platform == "win32":
            if autostart:
                items.append(
                    pystray.MenuItem(
                        "✓ Run on Windows Startup",
                        lambda _: self._disable_autostart(),
                    )
                )
            else:
                items.append(
                    pystray.MenuItem(
                        "  Run on Windows Startup",
                        lambda _: self._enable_autostart(),
                    )
                )

        items.append(pystray.Menu.SEPARATOR)

        # Re-run setup
        items.append(
            pystray.MenuItem(
                "🔧 Setup Device",
                lambda _: self._run_wizard(),
            )
        )

        items.append(pystray.Menu.SEPARATOR)

        # Open dashboard
        items.append(
            pystray.MenuItem(
                "🌐 Open Dashboard",
                lambda _: webbrowser.open(DASHBOARD_URL.rstrip('/') + "/dashboard"),
            )
        )

        # View logs
        log_path = SRC_DIR.parent / "logs" / "agent.log"
        if log_path.exists():
            items.append(
                pystray.MenuItem(
                    "📄 View Logs",
                    lambda _: os.startfile(str(log_path))
                    if sys.platform == "win32"
                    else subprocess.Popen(["open", str(log_path)]),
                )
            )

        items.append(pystray.Menu.SEPARATOR)

        # Quit
        items.append(
            pystray.MenuItem("✕  Quit RemoteMCU", self._quit)
        )

        return pystray.Menu(*items)

    def _run_wizard(self):
        """Manually trigger the setup wizard."""
        import subprocess
        print("[Tray] Launching Setup Wizard in external process...")
        
        script_path = os.path.join(os.path.dirname(__file__), "setup_wizard.py")
        subprocess.run([sys.executable, script_path, "--force"])
        
        # Reload the agent to pick up any new configuration
        self._restart_agent()

    def _update_menu(self):
        """Rebuild and apply the tray menu."""
        if self._tray:
            self._tray.menu = self._build_menu()
            self._tray.update_menu()

    # ── Lifecycle ─────────────────────────────────────────────────────────

    def _quit(self, icon: pystray.Icon = None, item=None):
        """Stop the agent and exit the tray app."""
        print("[Tray] Quitting…")
        self._stop_agent()
        if self._tray:
            self._tray.stop()

    def run(self):
        """
        Entry point. Creates the tray icon, starts the agent automatically,
        and runs the tray event loop (blocks until quit).
        """
        # --- Run setup in the main thread on first launch ---
        if not is_configured():
            print("[Tray] Launching setup wizard before starting tray...")
            if run_setup_gui():
                # Setup success, proceed
                pass
            else:
                print("[Tray] Setup not completed. You can complete it from the menu.")
        
        # Create the tray icon with the initial "idle" color
        initial_icon = _make_icon(COLORS["idle"])
        self._tray = pystray.Icon(
            name=APP_NAME,
            icon=initial_icon,
            title=f"{APP_NAME} — {STATUS_LABELS['idle']}",
            menu=self._build_menu(),
        )

        # Auto-start the agent immediately when the tray opens
        # (runs in a separate thread so the tray is responsive)
        threading.Thread(target=self._start_agent, daemon=True).start()

        print(f"[Tray] RemoteMCU tray app starting. Dashboard: {DASHBOARD_URL}")
        self._tray.run()  # Blocks here — tray event loop


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    app = RemoteMCUTrayApp()
    app.run()


if __name__ == "__main__":
    main()
