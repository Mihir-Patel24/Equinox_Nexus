# ── Equinox Nexus — Backend Dockerfile ────────────────────────────────────────
# Python 3.11-slim for a minimal, production-grade image
# All model .pkl files, RAG knowledge base, and Datasets are baked in.

FROM python:3.11-slim AS builder

WORKDIR /build

# System deps for psycopg2-binary, sentence-transformers, and prophet
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Runtime system libraries only (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source
COPY . /app

# Ensure chroma_data directory exists (will be overridden by volume mount in prod)
RUN mkdir -p /app/chroma_data /app/rag/chroma_db

# Non-root user for security
RUN useradd -m -u 1001 equinox && chown -R equinox:equinox /app
USER equinox

# Expose backend port
EXPOSE 8000

# Health check — calls /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start uvicorn (single worker in container — scale horizontally via replicas)
CMD ["python", "-m", "uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--log-level", "info", \
     "--no-access-log"]
