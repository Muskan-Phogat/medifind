# setup.ps1 - MediFind Complete One-Command Setup
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " MediFind Environment Setup" -ForegroundColor Green
Write-Host " 'We don't list medicines, we verify them.'" -ForegroundColor DarkGreen
Write-Host "==========================================================" -ForegroundColor Green

# 1. Verify Prerequisites
try {
    $pythonVersion = python --version
    Write-Host "[OK] Found Python: $pythonVersion" -ForegroundColor Gray
} catch {
    Write-Error "Python 3 is required. Please install Python from https://www.python.org/"
    exit 1
}

try {
    $nodeVersion = node --version
    Write-Host "[OK] Found Node.js: $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Error "Node.js 18+ is required. Please install Node.js from https://nodejs.org/"
    exit 1
}

# 2. Environment Files
if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] Created root .env from .env.example" -ForegroundColor Gray
}

if (-not (Test-Path "backend\.env") -and (Test-Path "backend\.env.example")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "[OK] Created backend\.env from backend\.env.example" -ForegroundColor Gray
}

if (-not (Test-Path "frontend\.env") -and (Test-Path "frontend\.env.example")) {
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "[OK] Created frontend\.env from frontend\.env.example" -ForegroundColor Gray
}

# 3. Backend Virtual Environment & Dependencies
Write-Host "[*] Setting up Python virtual environment (backend/.venv)..." -ForegroundColor Cyan
if (-not (Test-Path "backend\.venv")) {
    python -m venv "backend\.venv"
}

$venvPython = "backend\.venv\Scripts\python.exe"
$venvPip = "backend\.venv\Scripts\pip.exe"

Write-Host "[*] Installing backend dependencies..." -ForegroundColor Cyan
& $venvPython -m pip install --quiet --upgrade pip
& $venvPip install --quiet -r "backend\requirements.txt"
Write-Host "[OK] Backend dependencies installed." -ForegroundColor Green

# 4. Database Initialization & Seed
Write-Host "[*] Seeding SQLite database with 14 fictional pharmacies and 74 medicines..." -ForegroundColor Cyan
& $venvPython "database\seed.py" --reset
Write-Host "[OK] Database seeded successfully." -ForegroundColor Green

# 5. Frontend Dependencies
Write-Host "[*] Installing frontend npm dependencies..." -ForegroundColor Cyan
Push-Location "frontend"
npm install --silent
Pop-Location
Write-Host "[OK] Frontend dependencies installed." -ForegroundColor Green

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Setup Complete! You can now run the application:" -ForegroundColor Green
Write-Host "   .\run.ps1" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
