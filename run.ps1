#!/usr/bin/env pwsh
# Equinox Nexus — One-Command Startup (PowerShell)
# Usage: .\run.ps1
# Starts both the FastAPI backend and Next.js frontend simultaneously.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  ███████╗ ██████╗ ██╗   ██╗██╗███╗   ██╗ ██████╗ ██╗  ██╗" -ForegroundColor Cyan
Write-Host "  ██╔════╝██╔═══██╗██║   ██║██║████╗  ██║██╔═══██╗╚██╗██╔╝" -ForegroundColor Cyan
Write-Host "  █████╗  ██║   ██║██║   ██║██║██╔██╗ ██║██║   ██║ ╚███╔╝ " -ForegroundColor Cyan
Write-Host "  ██╔══╝  ██║▄▄ ██║██║   ██║██║██║╚██╗██║██║   ██║ ██╔██╗ " -ForegroundColor Cyan
Write-Host "  ███████╗╚██████╔╝╚██████╔╝██║██║ ╚████║╚██████╔╝██╔╝ ██╗" -ForegroundColor Cyan
Write-Host "  ╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝" -ForegroundColor Cyan
Write-Host "                    N E X U S  v3.1" -ForegroundColor Magenta
Write-Host ""

# ── Validate .env exists ──────────────────────────────────────────────────────
$envFile = "core\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "  [WARN] core\.env not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item "core\.env.example" $envFile
    Write-Host "  [ACTION REQUIRED] Open core\.env and set your GROQ_API_KEY" -ForegroundColor Red
    Write-Host "  Get a free key at: https://console.groq.com/keys" -ForegroundColor Yellow
    Write-Host ""
}

# ── Validate GROQ_API_KEY is set ──────────────────────────────────────────────
$envContent = Get-Content $envFile -Raw
if ($envContent -match "GROQ_API_KEY=your_groq_api_key_here" -or $envContent -notmatch "GROQ_API_KEY=.+") {
    Write-Host "  [WARN] GROQ_API_KEY not configured in core\.env" -ForegroundColor Yellow
    Write-Host "         Decision Intelligence Agent will be limited." -ForegroundColor Yellow
    Write-Host ""
}

# ── Check ports are free ──────────────────────────────────────────────────────
function Test-Port($port) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

function Stop-ProcessOnPort($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $pid = $conn.OwningProcess
        Write-Host "  [CLEANUP] Stopping process $pid holding port $port..." -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

Stop-ProcessOnPort 8000
Stop-ProcessOnPort 3000

# ── Start Backend ─────────────────────────────────────────────────────────────
Write-Host "  Starting FastAPI backend on http://localhost:8000 ..." -ForegroundColor Green
$backend = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory "$PSScriptRoot\core" -PassThru -NoNewWindow

Write-Host "  Backend PID: $($backend.Id)" -ForegroundColor DarkGray

# Wait for backend to be ready
Write-Host "  Waiting for backend to start..." -ForegroundColor DarkGray
$maxWait = 30
$waited = 0
do {
    Start-Sleep -Seconds 1
    $waited++
    $ready = Test-Port 8000
} while (-not $ready -and $waited -lt $maxWait)

if ($ready) {
    Write-Host "  [OK] Backend ready at http://localhost:8000" -ForegroundColor Green
    Write-Host "       API docs: http://localhost:8000/docs" -ForegroundColor DarkGray
} else {
    Write-Host "  [WARN] Backend didn't respond in ${maxWait}s - check for errors" -ForegroundColor Yellow
}

# ── Start Frontend ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  Starting Next.js frontend on http://localhost:3000 ..." -ForegroundColor Green
$frontend = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WorkingDirectory $PSScriptRoot -PassThru -NoNewWindow

Write-Host "  Frontend PID: $($frontend.Id)" -ForegroundColor DarkGray

# ── Done ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   Frontend  →  http://localhost:3000" -ForegroundColor White
Write-Host "   Backend   →  http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs  →  http://localhost:8000/docs" -ForegroundColor White
Write-Host "   Health    →  http://localhost:8000/health" -ForegroundColor White
Write-Host "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop both servers." -ForegroundColor DarkGray
Write-Host ""

# Keep running until Ctrl+C, then clean up
try {
    Wait-Process -Id $backend.Id, $frontend.Id
} finally {
    Write-Host ""
    Write-Host "  Stopping servers..." -ForegroundColor Yellow
    if (-not $backend.HasExited) { Stop-Process -Id $backend.Id -Force }
    if (-not $frontend.HasExited) { Stop-Process -Id $frontend.Id -Force }
    Write-Host "  Stopped. Goodbye." -ForegroundColor DarkGray
}
