# ── Equinox Nexus — One-Command Deploy Script (Windows PowerShell) ─────────────
# Usage: .\deploy.ps1
#
# Prerequisites:
#   - Docker Desktop for Windows installed and running
#   - .env.production filled in (copy .env.production and set real secrets)
#   - GROQ_API_KEY set in .env.production

$ErrorActionPreference = "Stop"

function Log   { param($m) Write-Host "[DEPLOY] $m" -ForegroundColor Cyan }
function Ok    { param($m) Write-Host "[  OK  ] $m" -ForegroundColor Green }
function Warn  { param($m) Write-Host "[ WARN ] $m" -ForegroundColor Yellow }
function Err   { param($m) Write-Host "[ERROR ] $m" -ForegroundColor Red }

# ── Pre-flight checks ─────────────────────────────────────────────────────────
Log "Running pre-flight checks..."

if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Err "Docker is not installed. Visit https://docs.docker.com/desktop/install/windows/"
    exit 1
}

try { docker compose version | Out-Null }
catch {
    Err "docker compose v2 not found. Update Docker Desktop."
    exit 1
}

if (-not (Test-Path ".env.production")) {
    Err ".env.production not found. Copy .env.production template and fill in your secrets."
    exit 1
}

$envContent = Get-Content ".env.production" -Raw
if ($envContent -match "CHANGE_ME") {
    Warn ".env.production still contains CHANGE_ME placeholder values."
    $confirm = Read-Host "Continue anyway? (y/N)"
    if ($confirm -notmatch "^[Yy]$") { Log "Aborted."; exit 0 }
}

Ok "Pre-flight checks passed."

# ── Create nginx SSL directory ────────────────────────────────────────────────
if (-not (Test-Path "nginx\ssl")) {
    New-Item -ItemType Directory -Path "nginx\ssl" | Out-Null
    Log "Created nginx/ssl directory."
}

# ── Build images ──────────────────────────────────────────────────────────────
Log "Building Docker images (this may take 5-10 minutes on first run)..."
docker compose --env-file .env.production build --no-cache
Ok "Images built."

# ── Start services ────────────────────────────────────────────────────────────
Log "Starting all services..."
docker compose --env-file .env.production up -d

# ── Wait for healthy status ───────────────────────────────────────────────────
Log "Waiting for services to become healthy..."
$maxWait = 180; $elapsed = 0; $interval = 5

while ($elapsed -lt $maxWait) {
    $backendStatus  = (docker inspect --format='{{.State.Health.Status}}' equinox-backend  2>$null) ?? "starting"
    $postgresStatus = (docker inspect --format='{{.State.Health.Status}}' equinox-postgres 2>$null) ?? "starting"

    if ($backendStatus -eq "healthy" -and $postgresStatus -eq "healthy") {
        Ok "All services healthy!"
        break
    }

    Write-Host -NoNewline "`r  Postgres: $postgresStatus | Backend: $backendStatus | Elapsed: ${elapsed}s   "
    Start-Sleep $interval
    $elapsed += $interval
}

if ($elapsed -ge $maxWait) {
    Warn "Services did not become healthy within ${maxWait}s. Check logs:"
    Write-Host "  docker compose logs backend"
    Write-Host "  docker compose logs postgres"
}

# ── Smoke test ────────────────────────────────────────────────────────────────
Log "Running smoke test..."
try {
    $resp = Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing -TimeoutSec 10
    if ($resp.StatusCode -eq 200) { Ok "Smoke test passed — /api/health returned 200." }
    else { Warn "Unexpected status: $($resp.StatusCode)" }
} catch {
    Warn "Smoke test failed: $_"
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         Equinox Nexus — Deployed!                    ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  http://localhost" -ForegroundColor Cyan
Write-Host "  API:       http://localhost/api" -ForegroundColor Cyan
Write-Host "  API Docs:  http://localhost/api/docs" -ForegroundColor Cyan
Write-Host "  Health:    http://localhost/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Useful commands:" -ForegroundColor Yellow
Write-Host "    docker compose logs -f backend   # Backend logs"
Write-Host "    docker compose ps                # Service status"
Write-Host "    docker compose down              # Stop all services"
Write-Host "    docker compose down -v           # Stop + delete volumes (DESTROYS DATA)"
