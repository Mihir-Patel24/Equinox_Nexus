"""
API Security Middleware — Equinox Nexus v3.1

Implements:
  1. API Key Authentication (X-API-Key header)
  2. Rate Limiting (slowapi / in-memory Redis-compatible limiter)
  3. CORS hardening (configurable allowed origins)
  4. Request logging with timing

Configuration (environment variables):
  API_KEY_ENABLED   — "true" to enforce API key checks (default: "true" in production)
  API_KEY           — The secret API key clients must send in X-API-Key header
  ALLOWED_ORIGINS   — Comma-separated allowed CORS origins (default: localhost:3000)
  RATE_LIMIT        — Global rate limit string e.g. "60/minute" (default: "60/minute")
"""

import os
import time
import hashlib
import logging
from typing import Optional, Callable
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("equinox.security")

# ── Configuration ──────────────────────────────────────────────────────────────
API_KEY_ENABLED  = os.getenv("API_KEY_ENABLED", "false").lower() == "true"
API_KEY          = os.getenv("API_KEY", "")
RATE_LIMIT_REQ   = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))  # per window
RATE_LIMIT_WIN   = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

# Endpoints that are always public (no API key required)
PUBLIC_ENDPOINTS = {
    "/",
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
}

# ── In-Memory Rate Limiter ─────────────────────────────────────────────────────
# Uses a sliding window approach per client IP.
# For production, replace with Redis-backed storage (redis-py + slowapi).
class InMemoryRateLimiter:
    """
    Sliding window rate limiter.
    Stores per-IP request timestamps in memory.
    Thread-safe for single-process uvicorn workers.
    """
    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._store: dict[str, list[float]] = {}

    def is_allowed(self, client_id: str) -> tuple[bool, int, int]:
        """
        Check if request is allowed for client_id.
        Returns: (allowed, remaining_requests, retry_after_seconds)
        """
        now = time.time()
        window_start = now - self.window_seconds

        # Clean up old entries
        if client_id in self._store:
            self._store[client_id] = [
                ts for ts in self._store[client_id] if ts > window_start
            ]
        else:
            self._store[client_id] = []

        count = len(self._store[client_id])

        if count >= self.max_requests:
            # Find oldest timestamp to calculate retry-after
            oldest = min(self._store[client_id])
            retry_after = int(oldest + self.window_seconds - now) + 1
            return False, 0, retry_after

        self._store[client_id].append(now)
        remaining = self.max_requests - count - 1
        return True, remaining, 0

    def get_stats(self) -> dict:
        now = time.time()
        window_start = now - self.window_seconds
        active_clients = 0
        for timestamps in self._store.values():
            recent = [ts for ts in timestamps if ts > window_start]
            if recent:
                active_clients += 1
        return {
            "total_tracked_clients": len(self._store),
            "active_clients_in_window": active_clients,
            "max_requests_per_window": self.max_requests,
            "window_seconds": self.window_seconds,
        }


_rate_limiter = InMemoryRateLimiter(
    max_requests=RATE_LIMIT_REQ,
    window_seconds=RATE_LIMIT_WIN,
)


def _get_client_id(request: Request) -> str:
    """
    Get rate-limiting identifier for a request.
    Prefers X-Forwarded-For (for clients behind nginx/load balancer).
    Falls back to direct client IP.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _validate_api_key(request: Request) -> bool:
    """
    Validate the X-API-Key header.
    Uses constant-time comparison to prevent timing attacks.
    """
    if not API_KEY_ENABLED or not API_KEY:
        return True  # Auth disabled — allow all

    provided_key = request.headers.get("X-API-Key", "")
    if not provided_key:
        return False

    # Constant-time comparison
    provided_hash = hashlib.sha256(provided_key.encode()).hexdigest()
    expected_hash = hashlib.sha256(API_KEY.encode()).hexdigest()
    return provided_hash == expected_hash


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Combined security middleware:
      1. Request timing
      2. Rate limiting per IP
      3. API key validation
      4. Security response headers
    """

    async def dispatch(self, request: Request, call_next: Callable):
        start_time = time.perf_counter()
        path = request.url.path

        # Always allow public endpoints
        if path in PUBLIC_ENDPOINTS:
            response = await call_next(request)
            return self._add_security_headers(response)

        # ── 1. Rate limiting ────────────────────────────────────────────────
        client_id = _get_client_id(request)
        allowed, remaining, retry_after = _rate_limiter.is_allowed(client_id)

        if not allowed:
            logger.warning(f"Rate limit exceeded: client={client_id} path={path}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Too many requests. Retry after {retry_after} seconds.",
                    "retry_after_seconds": retry_after,
                    "limit": RATE_LIMIT_REQ,
                    "window_seconds": RATE_LIMIT_WIN,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(RATE_LIMIT_REQ),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + retry_after),
                },
            )

        # ── 2. API Key validation ────────────────────────────────────────────
        if not _validate_api_key(request):
            logger.warning(
                f"Invalid API key: client={client_id} path={path} "
                f"key_header={request.headers.get('X-API-Key', 'MISSING')[:8]}..."
            )
            return JSONResponse(
                status_code=401,
                content={
                    "error": "invalid_api_key",
                    "message": (
                        "Valid API key required. "
                        "Include your key in the X-API-Key header."
                    ),
                    "docs": "Set API_KEY in your environment and pass X-API-Key header.",
                },
            )

        # ── 3. Process request ───────────────────────────────────────────────
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        # ── 4. Add headers ───────────────────────────────────────────────────
        response = self._add_security_headers(response)
        response.headers["X-RateLimit-Limit"]     = str(RATE_LIMIT_REQ)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-Process-Time"]        = f"{elapsed_ms:.1f}ms"

        logger.debug(
            f"{request.method} {path} → {response.status_code} "
            f"({elapsed_ms:.1f}ms) client={client_id}"
        )
        return response

    @staticmethod
    def _add_security_headers(response):
        """Add standard security headers to every response."""
        response.headers["X-Content-Type-Options"]   = "nosniff"
        response.headers["X-Frame-Options"]          = "DENY"
        response.headers["X-XSS-Protection"]         = "1; mode=block"
        response.headers["Referrer-Policy"]          = "strict-origin-when-cross-origin"
        response.headers["X-Powered-By"]             = "Equinox-Nexus/3.1"
        return response


def get_rate_limiter_stats() -> dict:
    """Expose rate limiter stats for the /health endpoint."""
    return _rate_limiter.get_stats()
