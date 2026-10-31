@echo off
cd /d "%~dp0"
if exist ".venv\Scripts\pythonw.exe" (
    start "" ".venv\Scripts\pythonw.exe" "launch_gui.py"
) else (
    python -m spine_extractor --gui
    if errorlevel 1 pause
)
