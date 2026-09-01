# Equinox Nexus — Deployment Guide

## Architecture

```
Internet → nginx:80/443
              ├── /api/*  → FastAPI backend:8000  ← PostgreSQL + ChromaDB
              └── /*      → Next.js frontend:3000
```

All four services run in an isolated Docker bridge network. Only nginx exposes ports publicly.

---

## Prerequisites

- **Docker Desktop** (Windows/macOS) or **Docker Engine 24+** (Linux)
- A **Groq API key** (free at [console.groq.com/keys](https://console.groq.com/keys))

---

## Step 1 — Configure Secrets

Copy the template and fill in your real values:

```bash
# Linux/macOS
cp .env.production .env.production.local  # optional backup
```

Open `.env.production` and set:

| Variable | What to set |
|---|---|
| `POSTGRES_PASSWORD` | Any strong password, e.g. `openssl rand -hex 32` |
| `API_KEY` | Generate with `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `GROQ_API_KEY` | Your Groq key from console.groq.com |
| `NEXT_PUBLIC_API_URL` | `http://your-domain.com/api` (or `http://localhost/api` for local) |
| `ALLOWED_ORIGINS` | `https://your-domain.com` (comma-separated) |

---

## Step 2 — Deploy

**Windows (PowerShell):**
```powershell
.\deploy.ps1
```

**Linux/macOS:**
```bash
chmod +x deploy.sh && ./deploy.sh
```

The script will:
1. Verify Docker is available
2. Build all images (takes 5–10 min first time)
3. Start postgres → backend → frontend → nginx
4. Wait for all health checks to pass
5. Run a smoke test
6. Print all endpoint URLs

---

## Step 3 — Verify

```bash
# All 4 containers should be healthy
docker compose ps

# API health check
curl http://localhost/api/health

# View logs
docker compose logs -f backend
docker compose logs -f nginx
```

---

## Enabling HTTPS (Optional)

1. Point your domain's DNS A-record to your server IP
2. Obtain a Let's Encrypt certificate:
   ```bash
   certbot certonly --standalone -d your-domain.com
   cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
   cp /etc/letsencrypt/live/your-domain.com/privkey.pem   nginx/ssl/
   ```
3. In `nginx/nginx.conf`, uncomment the HTTPS server block and comment out the HTTP-only block
4. Restart nginx: `docker compose restart nginx`

---

## Database

- **Local dev:** SQLite (`core/twin/twins.db`) — zero configuration
- **Production:** PostgreSQL running in the `equinox-postgres` container
  - Data persists in a named Docker volume: `equinox_postgres_data`
  - To inspect: `docker exec -it equinox-postgres psql -U equinox equinox_nexus`

### Backup PostgreSQL
```bash
docker exec equinox-postgres pg_dump -U equinox equinox_nexus > backup_$(date +%Y%m%d).sql
```

### Restore PostgreSQL
```bash
cat backup_20260825.sql | docker exec -i equinox-postgres psql -U equinox equinox_nexus
```

---

## ChromaDB (RAG Vector Store)

- Stored in named Docker volume: `equinox_chroma_data`
- Mounted at `/app/chroma_data` inside the backend container
- Automatically re-indexed from `core/rag/compliance_kb/*.md` on first boot

---

## Useful Commands

```bash
# Start all services
docker compose --env-file .env.production up -d

# Stop all services (keeps data)
docker compose down

# Stop and DESTROY all data (volumes)
docker compose down -v

# Rebuild a single service
docker compose build --no-cache backend
docker compose up -d backend

# Stream backend logs
docker compose logs -f backend

# Shell into backend
docker exec -it equinox-backend bash

# Refresh FX calibration manually
curl -X POST http://localhost/api/admin/refresh-fx
```

---

## API Key Usage (Frontend → Backend)

When `API_KEY_ENABLED=true`, all API calls must include:
```
X-API-Key: <your API_KEY value from .env.production>
```

The frontend reads this from `NEXT_PUBLIC_API_KEY` if you add it to your env. For internal use behind nginx, you may also whitelist the Docker network and disable API key auth on internal-only endpoints.
