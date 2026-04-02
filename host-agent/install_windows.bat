@echo off
:: RemoteMCU Host Agent — Windows Installer Script
:: =================================================
:: Run this script ONCE to install the host-agent as a Windows startup app.
:: It will:
::   1. Install all Python dependencies (pip)
::   2. Add the tray app to Windows startup
::   3. Launch the tray app immediately
::
:: Requirements: Python 3.10+ must be in PATH.
:: Run as a normal user (no admin needed for startup-folder install).

setlocal enabledelayedexpansion

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║       RemoteMCU Host Agent Setup         ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ── Check Python ──────────────────────────────────────────────────────────
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo         Download it from https://python.org/downloads
    pause
    exit /b 1
)

for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo [OK] Python %PYVER% found

:: ── Install dependencies ───────────────────────────────────────────────────
echo.
echo [1/3] Installing Python dependencies...
pip install -r "%~dp0requirements.txt" --quiet
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pip install failed. Check your internet connection.
    pause
    exit /b 1
)
echo [OK] Dependencies installed

:: ── Write .env.local prompts if not present ────────────────────────────────
set ENVFILE=%~dp0.env
if not exist "%ENVFILE%" (
    echo.
    echo [2/3] Creating .env configuration file...
    echo # RemoteMCU Host Agent Configuration > "%ENVFILE%"
    echo # Fill in these values from your Firebase console >> "%ENVFILE%"
    echo FIREBASE_PROJECT_ID=your-project-id >> "%ENVFILE%"
    echo FIREBASE_ID_TOKEN= >> "%ENVFILE%"
    echo NEXT_PUBLIC_MQTT_BROKER_URL=wss://your-broker.hivemq.cloud:8884/mqtt >> "%ENVFILE%"
    echo NEXT_PUBLIC_MQTT_USERNAME= >> "%ENVFILE%"
    echo NEXT_PUBLIC_MQTT_PASSWORD= >> "%ENVFILE%"
    echo DEVICE_ID=device-001 >> "%ENVFILE%"
    echo API_KEY= >> "%ENVFILE%"
    echo [OK] Created .env — please edit it with your credentials before starting
) else (
    echo [2/3] .env file already exists — skipping
)

:: ── Add to Windows startup via Startup folder (no admin needed) ───────────
echo.
echo [3/3] Registering auto-start on Windows login...

set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT=%STARTUP_DIR%\RemoteMCU Agent.lnk

:: Find pythonw.exe (runs without a console window)
for /f "delims=" %%p in ('where pythonw 2^>nul') do set PYTHONW=%%p
if "!PYTHONW!"=="" (
    :: Fallback: derive from python.exe location
    for /f "delims=" %%p in ('where python') do set PYTHON=%%p
    set PYTHONW=!PYTHON:python.exe=pythonw.exe!
)

set SCRIPT=%~dp0src\tray_app.py

:: Use PowerShell to create a proper .lnk shortcut
powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; ^
   $s = $ws.CreateShortcut('%SHORTCUT%'); ^
   $s.TargetPath = '!PYTHONW!'; ^
   $s.Arguments = '\"!SCRIPT!\"'; ^
   $s.WorkingDirectory = '%~dp0src'; ^
   $s.WindowStyle = 7; ^
   $s.Description = 'RemoteMCU Host Agent'; ^
   $s.Save()"

if exist "%SHORTCUT%" (
    echo [OK] Auto-start shortcut created: %SHORTCUT%
) else (
    echo [WARN] Could not create shortcut — you can enable auto-start from the tray menu
)

:: ── Launch immediately ─────────────────────────────────────────────────────
echo.
echo [OK] Setup complete! Launching RemoteMCU Agent...
echo       Look for the circle icon in your system tray.
echo       Right-click it to open the dashboard or configure settings.
echo.

start "" "!PYTHONW!" "%SCRIPT%"
timeout /t 2 /nobreak >nul

echo Done. You can close this window.
pause
