# run.ps1 - MediFind One-Command Multi-Process Runner
$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " MediFind Application Runner" -ForegroundColor Green
Write-Host " 'We don't list medicines, we verify them.'" -ForegroundColor DarkGreen
Write-Host "==========================================================" -ForegroundColor Green

# 1. Detect LAN IP for multi-device Wi-Fi demo
$detectedIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' } | Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $detectedIp) {
    $detectedIp = "localhost"
}

Write-Host "[*] Detected Local Network IP: $detectedIp" -ForegroundColor Cyan

# 2. Check Prerequisites
if (-not (Test-Path "backend\.venv\Scripts\python.exe")) {
    Write-Warning "backend\.venv not found. Running .\setup.ps1 first..."
    .\setup.ps1
}

# 3. Launch Backend in new window bound to 0.0.0.0
Write-Host "[*] Launching FastAPI Backend on 0.0.0.0:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting MediFind Backend...' -ForegroundColor Green; cd backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

# 4. Launch Frontend in new window bound to 0.0.0.0
Write-Host "[*] Launching Vite Frontend on 0.0.0.0:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting MediFind Frontend...' -ForegroundColor Green; cd frontend; npm run dev -- --host 0.0.0.0"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " MediFind is Running!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " [Laptop / Local Browser]" -ForegroundColor White
Write-Host "   - Patient App:            http://localhost:5173" -ForegroundColor Yellow
Write-Host "   - Pharmacist Simulator:   http://localhost:5173/pharmacist-sim" -ForegroundColor Yellow
Write-Host "   - Chemist Partner Portal: http://localhost:5173/pharmacy (Demo PIN: 1234)" -ForegroundColor Yellow
Write-Host "   - Hidden Demo Reset:      http://localhost:5173/demo-reset" -ForegroundColor Yellow
Write-Host "   - Backend API Docs:       http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host " [Mobile Phone on Same Wi-Fi]" -ForegroundColor White
Write-Host "   - Mobile Patient App:     http://${detectedIp}:5173" -ForegroundColor Cyan
Write-Host "   - Pharmacist Phone Sim:   http://${detectedIp}:5173/pharmacist-sim" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tip: Keep both newly opened terminal windows running to keep services alive." -ForegroundColor Gray
