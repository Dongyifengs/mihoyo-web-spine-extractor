param([string]$Python = "python")
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    & $Python -m PyInstaller --noconfirm --clean --onefile --windowed `
        --name MihoyoSpineExtractor --paths src `
        --collect-all tree_sitter_javascript --collect-all playwright launch_gui.py
    if ($LASTEXITCODE -ne 0) { throw "PyInstaller build failed" }
    Write-Host "Built: $projectRoot/dist/MihoyoSpineExtractor.exe"
} finally {
    Pop-Location
}
