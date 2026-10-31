@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
    py -3 -m venv .venv
    if errorlevel 1 goto error
)
".venv\Scripts\python.exe" -c "import spine_extractor, httpx, playwright.async_api, PIL.Image, tree_sitter, bs4" >nul 2>&1
if errorlevel 1 (
    ".venv\Scripts\python.exe" -m pip install --force-reinstall -e .
    if errorlevel 1 goto error
)
".venv\Scripts\python.exe" -m spine_extractor serve %*
if errorlevel 1 goto error
exit /b 0
:error
echo Startup failed. Install Python 3.11 or newer, check the network or change the port.
pause
exit /b 1
