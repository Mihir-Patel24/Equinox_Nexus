#!/usr/bin/env bash
# ── Equinox Nexus — One-Command Deploy Script (Linux/macOS) ────────────────────
# Usage: chmod +x deploy.sh && ./deploy.sh
#
# Prerequisites:
#   - Docker Engine 24+ and docker-compose v2+ installed
#   - .env.production filled in with your secrets (copy from .env.production template)
#   - GROQ_API_KEY set in .env.production

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

log()   { echo -e "${CYAN}[DEPLOY]${NC} $*"; }
ok()    { echo -e "${GREEN}[  OK  ]${NC} $*"; }
warn()  { echo -e "${YELLOW}[ WARN ]${NC} $*"; }
error() { echo -e "${RED}[ERROR ]${NC} $*" >&2; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────
log "Running pre-flight checks..."

if ! command -v docker &>/dev/null; then
    error "Docker is not installed. Visit https://docs.docker.com/engine/install/"
    exit 1
fi

if ! docker compose version &>/dev/null; then
    error "docker compose v2 not found. Update Docker Desktop or install the compose plugin."
    exit 1
fi

if [[ ! -f ".env.production" ]]; then
    error ".env.production not found. Copy .env.production and fill in your secrets."
    exit 1
fi

# Warn if secrets are still placeholder values
if grep -q "CHANGE_ME" .env.production; then
    warn ".env.production still contains CHANGE_ME placeholder values."
    warn "Please set real secrets before deploying to a public server."
    read -p "Continue anyway? (y/N): " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || { log "Aborted."; exit 0; }
fi

ok "Pre-flight checks passed."

# ── Create nginx SSL directory (needed even without certs to avoid mount error) ─
mkdir -p nginx/ssl
log "nginx/ssl directory ready."

# ── Build images ──────────────────────────────────────────────────────────────
log "Building Docker images (this may take 5–10 minutes on first run)..."
docker compose --env-file .env.production build --no-cache

ok "Images built successfully."

# ── Start services ────────────────────────────────────────────────────────────
log "Starting all services..."
docker compose --env-file .env.production up -d

# ── Wait for healthy status ───────────────────────────────────────────────────
log "Waiting for services to become healthy..."
MAX_WAIT=180
ELAPSED=0
INTERVAL=5

while [[ $ELAPSED -lt $MAX_WAIT ]]; do
    BACKEND_STATUS=$(docker inspect --format='{{.State.Health.Status}}' equinox-backend 2>/dev/null || echo "starting")
    POSTGRES_STATUS=$(docker inspect --format='{{.State.Health.Status}}' equinox-postgres 2>/dev/null || echo "starting")

    if [[ "$BACKEND_STATUS" == "healthy" && "$POSTGRES_STATUS" == "healthy" ]]; then
        ok "All services healthy!"
        break
    fi

    echo -ne "\r  Postgres: ${POSTGRES_STATUS} | Backend: ${BACKEND_STATUS} | Elapsed: ${ELAPSED}s   "
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [[ $ELAPSED -ge $MAX_WAIT ]]; then
    warn "Services did not become healthy within ${MAX_WAIT}s. Check logs:"
    echo "  docker compose logs backend"
    echo "  docker compose logs postgres"
fi

# ── Smoke test ────────────────────────────────────────────────────────────────
log "Running smoke test..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health || echo "000")

if [[ "$HTTP_STATUS" == "200" ]]; then
    ok "Smoke test passed — /api/health returned 200."
else
    warn "Smoke test returned HTTP $HTTP_STATUS. Check nginx and backend logs."
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Equinox Nexus — Deployed! 🚀               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Frontend:${NC}  http://localhost"
echo -e "  ${CYAN}API:${NC}       http://localhost/api"
echo -e "  ${CYAN}API Docs:${NC}  http://localhost/api/docs"
echo -e "  ${CYAN}Health:${NC}    http://localhost/api/health"
echo ""
echo -e "  Useful commands:"
echo -e "    ${YELLOW}docker compose logs -f backend${NC}    # Backend logs"
echo -e "    ${YELLOW}docker compose ps${NC}                 # Service status"
echo -e "    ${YELLOW}docker compose down${NC}               # Stop all services"
echo -e "    ${YELLOW}docker compose down -v${NC}            # Stop + delete volumes (DESTROYS DATA)"
