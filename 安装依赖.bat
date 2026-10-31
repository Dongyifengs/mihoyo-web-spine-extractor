@echo off
cd /d "%~dp0"
py -3 -m venv .venv
if errorlevel 1 goto error
".venv\Scripts\python.exe" -m pip install -e .
if errorlevel 1 goto error
echo Installation complete. Run the GUI launcher.
pause
exit /b 0
:error
echo Installation failed. Please install Python 3.11 or newer and check your connection.
pause
exit /b 1
