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
echo   ____                     _       __  __  ____ _   _ 
echo  ^|  _ \ ___ _ __ ___   ___^| ^|_ ___^|  \/  ^|/ ___^| ^| ^| ^|
echo  ^| ^|_) / _ \ '_ ` _ \ / _ \ __/ _ \ ^|\/^| ^| ^|   ^| ^| ^| ^|
echo  ^|  _ ^<  __/ ^| ^| ^| ^| ^| (_) ^| ^|^|  __/ ^|  ^| ^| ^|___^| ^|_^| ^|
echo  ^|_^| \_\___^|_^| ^|_^| ^|_^|\___/ \__\___^|_^|  ^|_^|\____^|\___/ 
echo.
echo                     Host Agent Setup
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

:: ── Add to Windows startup via Startup folder (no admin needed) ───────────
echo.
echo [2/2] Registering auto-start on Windows login...

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
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '!PYTHONW!'; $s.Arguments = '\"!SCRIPT!\"'; $s.WorkingDirectory = '%~dp0src'; $s.WindowStyle = 7; $s.Description = 'RemoteMCU Host Agent'; $s.Save()"

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
