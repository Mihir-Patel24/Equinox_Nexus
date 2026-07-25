"""
Equinox Nexus — FastAPI Core Server v3.0

Endpoints:
  POST /simulate           — Full agentic simulation (RAG + XAI + Twin + Monte Carlo)
  GET  /twin/{twin_id}     — Retrieve Financial Twin state + history
  GET  /twins              — List all active Financial Twins
  POST /payroll/analyze    — Enterprise payroll anomaly detection
  GET  /monitor/status     — Continuous monitoring status + latest FX rates
  GET  /health             — Health check
  GET  /                   — API metadata
"""

import asyncio
import sys
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

# ── Path setup so core sub-packages resolve correctly ─────────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from agents.graph import app as graph_app
from agents.state import AgentState
from agents.payroll_intel.payroll_intel import PayrollIntelAgent
from agents.research.research import get_research_agent, run_research_if_stale
from middleware.security import SecurityMiddleware, get_rate_limiter_stats

from twin.twin_store import get_or_create_twin, update_twin, get_twin, list_twins
from monitoring.monitor import get_monitor


# ── Lifespan: start background monitor when API boots ─────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the continuous FX monitor and Research Agent at startup."""
    # 1. Start continuous FX monitoring loop
    monitor = get_monitor()
    task = asyncio.create_task(monitor.run_forever())
    print("Equinox Nexus v3.1: Continuous monitor started.")

    # 2. Run Research Agent in a background thread if KB is stale
    # Uses asyncio.to_thread so it doesn't block the event loop
    async def _run_research_startup():
        try:
            loop = asyncio.get_event_loop()
            report = await loop.run_in_executor(None, run_research_if_stale)
            status = report.get("status", "unknown")
            count  = len(report.get("countries_updated", []))
            print(f"Research Agent startup: {status} — {count} countries updated")
        except Exception as e:
            print(f"Research Agent startup error (non-fatal): {e}")

    research_task = asyncio.create_task(_run_research_startup())
    print("Equinox Nexus v3.1: Research Agent launched (background).")

    try:
        yield
    finally:
        monitor.stop()
        task.cancel()
        research_task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
        print("Equinox Nexus: Monitor + Research Agent stopped cleanly.")


# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Equinox Nexus Core",
    version="3.1.0",
    description=(
        "Autonomous Agentic Financial Intelligence Platform. "
        "Powered by LangGraph (parallel), RAG (ChromaDB), XAI, Monte Carlo, "
        "Financial Digital Twins, and the Research Agent (live OECD/World Bank KB)."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-API-Key"],
)

# ── Security Middleware (Rate Limiting + API Key Auth) ─────────────────────────
# Add AFTER CORS so CORS pre-flight requests bypass auth
app.add_middleware(SecurityMiddleware)

from streaming import router as streaming_router
app.include_router(streaming_router)

payroll_intel = PayrollIntelAgent()


# ── Request / Response Models ──────────────────────────────────────────────────

class LifestylePreferences(BaseModel):
    housing_type: Optional[str] = "apartment"
    dining_frequency: Optional[str] = "moderate"
    fitness_level: Optional[str] = "gym_member"
    entertainment_budget: Optional[str] = "moderate"


class SimulationRequest(BaseModel):
    current_city: str
    target_city: str
    annual_income: float
    currency: str = "USD"
    monthly_expenses: Optional[float] = None
    current_wealth: Optional[float] = 0.0
    lifestyle_preferences: Optional[Dict[str, Any]] = {}
    twin_id: Optional[str] = None          # Pass existing twin ID to continue session


class PayrollAnalysisRequest(BaseModel):
    records: List[Dict[str, Any]]
    company_name: Optional[str] = "Unknown"


# ── Root & Health ──────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    import os
    kb_dir = os.path.join(os.path.dirname(__file__), "rag", "compliance_kb")
    kb_count = len([f for f in os.listdir(kb_dir) if f.endswith(".md")]) if os.path.exists(kb_dir) else 0
    return {
        "service": "Equinox Nexus Core",
        "version": "3.1.0",
        "status": "online",
        "agents": [
            "actuary",
            "fiscal_ghost",
            "nexus_rag",
            "chronos",
            "payroll_intel",
            "research_agent",
        ],
        "capabilities": [
            "Financial Digital Twin (persistent)",
            f"RAG Compliance Intelligence (ChromaDB + {kb_count} country docs)",
            "Monte Carlo Wealth Simulation (1000 GBM paths + Prophet FX drift)",
            "XAI Factor Decomposition (5-factor viability explanation)",
            "Payroll Anomaly Detection (Isolation Forest)",
            "Continuous FX Monitoring (30-min polling)",
            "Autonomous Research Agent (OECD + World Bank + IMF live data)",
        ],
        "security": {
            "rate_limiting": "active",
            "api_key_auth": os.getenv("API_KEY_ENABLED", "false"),
        },
    }


@app.get("/health")
async def health_check():
    """Health check with system status, rate limiter stats, and KB freshness."""
    import os
    monitor = get_monitor()
    kb_dir  = os.path.join(os.path.dirname(__file__), "rag", "compliance_kb")
    kb_docs = len([f for f in os.listdir(kb_dir) if f.endswith(".md")]) if os.path.exists(kb_dir) else 0
    return {
        "status": "healthy",
        "version": "3.1.0",
        "monitor_running": monitor._running,
        "active_twins": len(list_twins()),
        "compliance_kb_documents": kb_docs,
        "rate_limiter": get_rate_limiter_stats(),
        "api_key_auth_enabled": os.getenv("API_KEY_ENABLED", "false") == "true",
    }


# ── Main Simulation Endpoint ───────────────────────────────────────────────────

@app.post("/simulate")
async def simulate_relocation(request: SimulationRequest):
    """
    Full agentic relocation simulation.

    Pipeline:
      1. Load or create Financial Twin
      2. LangGraph parallel execution (Actuary + Fiscal Ghost + Nexus RAG → Chronos → Aggregator + XAI)
      3. Update Financial Twin with simulation result
      4. Return complete report with XAI, RAG citations, Twin ID, Monte Carlo bands
    """

    # ── 1. Financial Twin: load or create ────────────────────────────
    user_profile = {
        "annual_income": request.annual_income,
        "monthly_expenses": request.monthly_expenses or (request.annual_income / 12 * 0.6),
        "currency": request.currency,
        "current_wealth": request.current_wealth or 0.0,
        "lifestyle_preferences": request.lifestyle_preferences or {},
    }

    twin = get_or_create_twin(request.twin_id, user_profile)

    # ── 2. Build LangGraph initial state ─────────────────────────────
    initial_state: AgentState = {
        "twin_id": twin.twin_id,
        "session_id": None,
        "current_city": request.current_city,
        "target_city": request.target_city,
        "user_profile": user_profile,
        "risk_analysis": None,
        "expense_analysis": None,
        "compliance_analysis": None,
        "monte_carlo_result": None,
        "payroll_analysis": None,
        "agent_reasoning": [],
        "final_report": None,
        "wealth_projection": None,
        "xai_explanation": None,
        "errors": [],
    }

    # ── 3. Execute LangGraph (parallel fan-out) ───────────────────────
    try:
        result = graph_app.invoke(initial_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent pipeline error: {e}")

    # ── 4. Capture FX snapshot BEFORE updating twin ───────────────────
    # This is the fix for the broken drift detection: we capture live rates
    # at the moment of simulation so detect_drift() can compare later.
    monitor = get_monitor()
    current_fx = monitor.get_latest_fx()  # {} if monitor hasn't polled yet

    # ── 5. Update Financial Twin with result + FX snapshot ────────────
    update_twin(twin.twin_id, result, request.target_city, fx_snapshot=current_fx)

    # ── 6. Build twin drift alerts (compare vs previous simulations) ──
    drift_alerts = twin.detect_drift(current_fx=current_fx if current_fx else None)

    # ── 6. Compose API response ───────────────────────────────────────
    final_report = result.get("final_report") or {}
    xai = result.get("xai_explanation") or {}
    di_result = result.get("decision_intelligence") or {}

    return {
        "status": "success",
        "city": request.target_city,

        # ── Financial Twin ──────────────────────────────────────────
        "twin": {
            "twin_id": twin.twin_id,
            "total_simulations": len(twin.simulation_history),
            "best_city_so_far": twin.get_best_city(),
            "drift_alerts": drift_alerts,
            "fx_snapshot_captured": bool(current_fx),  # tells client if monitoring is live
        },

        # ── Core Data ───────────────────────────────────────────────
        "data": {
            "final_report": final_report,
            "wealth_projection": result.get("wealth_projection"),
            "monte_carlo_result": result.get("monte_carlo_result"),
            "risk_analysis": result.get("risk_analysis"),
            "expense_analysis": result.get("expense_analysis"),
            "compliance_analysis": result.get("compliance_analysis"),
        },

        # ── XAI — Explainable AI ────────────────────────────────────
        "xai": {
            "viability_score": xai.get("viability_score", final_report.get("relocation_viability_score", 0)),
            "confidence_interval": xai.get("confidence_interval", []),
            "executive_summary": xai.get("executive_summary", ""),
            "factor_contributions": xai.get("factor_contributions", []),
            "key_risks": xai.get("key_risks", []),
            "key_advantages": xai.get("key_advantages", []),
            "methodology": xai.get("methodology", {}),
        },

        # ── Decision Intelligence (LLM Synthesis) ───────────────────
        # The raw Groq LLM output — score + natural-language rationale
        # This is separate from XAI so the frontend can display both.
        "decision_intelligence": {
            "llm_viability_score": di_result.get("decision_viability_score"),
            "llm_reasoning": di_result.get("dynamic_reasoning", ""),
            "model_used": "Groq llama-3.3-70b-versatile" if di_result.get("decision_viability_score") else "fallback (no LLM)",
        },

        # ── RAG Compliance Intelligence ──────────────────────────────
        "compliance_intelligence": {
            "compliance_notes": final_report.get("compliance_notes", []),
            "rag_sources": final_report.get("rag_sources", []),
            "visa_requirements": final_report.get("visa_requirements", ""),
            "treaty_label": final_report.get("treaty_label", ""),
            "compliance_brief_excerpt": result.get("compliance_analysis", {}).get("compliance_brief_excerpt", ""),
        },

        # ── Agent Reasoning Trace ───────────────────────────────────
        "agent_trace": result.get("agent_reasoning", []),
        "agents_executed": len(result.get("agent_reasoning", [])),

        # ── Errors (non-fatal) ──────────────────────────────────────
        "errors": result.get("errors", []),
    }


# ── Financial Twin Endpoints ───────────────────────────────────────────────────

@app.get("/twin/{twin_id}")
async def get_financial_twin(twin_id: str):
    """
    Retrieve the full state of a Financial Digital Twin.
    Returns simulation history, drift alerts, and best city recommendation.
    """
    twin = get_twin(twin_id)
    if not twin:
        raise HTTPException(status_code=404, detail=f"Twin '{twin_id}' not found.")

    monitor = get_monitor()
    current_fx = monitor.get_latest_fx()
    drift_alerts = twin.detect_drift(current_fx=current_fx if current_fx else None)

    return {
        "status": "success",
        "twin": twin.to_dict(),
        "drift_alerts": drift_alerts,
        "monitor_status": monitor.get_status(),
    }


@app.get("/twins")
async def list_all_twins():
    """List all active Financial Twins (summaries only)."""
    return {
        "status": "success",
        "count": len(list_twins()),
        "twins": list_twins(),
    }


# ── Monitoring Endpoint ────────────────────────────────────────────────────────

@app.get("/monitor/status")
async def monitor_status():
    """Return current monitoring status and latest FX rates."""
    monitor = get_monitor()
    fx = monitor.get_latest_fx()
    return {
        "status": "success",
        "monitor": monitor.get_status(),
        "sample_fx_rates": {k: fx[k] for k in list(fx.keys())[:10]} if fx else {},
        "total_currencies_tracked": len(fx),
    }


# ── Payroll Intelligence Endpoint ──────────────────────────────────────────────

@app.post("/payroll/analyze")
async def analyze_payroll(request: PayrollAnalysisRequest):
    """
    Enterprise payroll anomaly detection.
    Hybrid: rule-based + Isolation Forest.
    Detects ghost employees, salary spikes, duplicate billing, overpayments.
    """
    if not request.records:
        raise HTTPException(status_code=400, detail="No payroll records provided.")
    if len(request.records) > 10000:
        raise HTTPException(status_code=400, detail="Batch size exceeds 10,000 records.")

    try:
        result = payroll_intel.analyze_payroll(request.records)
        return {
            "status": "success",
            "company": request.company_name,
            "analysis": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Research Agent Endpoints ───────────────────────────────────────────────────

class ResearchRefreshRequest(BaseModel):
    force: bool = False
    countries: Optional[List[str]] = None  # ISO3 codes e.g. ["GBR", "SGP"]


@app.post("/research/refresh")
async def trigger_research_refresh(request: ResearchRefreshRequest, background_tasks: BackgroundTasks):
    """
    Trigger the Research Agent to refresh the RAG compliance knowledge base.

    The agent fetches live macroeconomic data from:
      - World Bank API  (inflation, GDP growth, unemployment)
      - OECD.Stat API   (tax revenue, fiscal indicators)
      - IMF Data API    (CPI forecasts)

    Runs in the background — returns immediately with a confirmation.
    Check /research/status to see the result.

    Args:
        force:     Skip the 7-day freshness check and always refresh.
        countries: Optional list of ISO3 codes to refresh (e.g. ["GBR", "SGP"]).
                   Pass null/empty to refresh all configured countries (15 total).
    """
    agent = get_research_agent()

    def _run():
        agent.run(force=request.force, countries=request.countries or None)

    background_tasks.add_task(_run)

    target = request.countries if request.countries else "all configured countries"
    return {
        "status": "accepted",
        "message": f"Research Agent started in background for: {target}",
        "force_refresh": request.force,
        "note": "Check /research/status for completion details.",
    }


@app.get("/research/status")
async def research_status():
    """
    Return the Research Agent's last run status and KB freshness info.
    Shows which countries were updated, API calls made, and any errors.
    """
    from agents.research.research import LAST_RUN_FILE, MIN_REFRESH_DAYS
    import json

    if not LAST_RUN_FILE.exists():
        return {
            "status": "never_run",
            "message": "Research Agent has not run yet. POST /research/refresh to trigger.",
            "kb_fresh": False,
        }

    try:
        last_run = json.loads(LAST_RUN_FILE.read_text())
        from datetime import datetime
        last_ts = datetime.fromisoformat(last_run.get("timestamp", "2000-01-01"))
        age_days = (datetime.utcnow() - last_ts).days
        is_fresh = age_days < MIN_REFRESH_DAYS

        return {
            "status": "success",
            "last_run_timestamp": last_run.get("timestamp"),
            "age_days": age_days,
            "kb_fresh": is_fresh,
            "refresh_threshold_days": MIN_REFRESH_DAYS,
            "countries_updated": last_run.get("countries_updated", []),
            "api_calls_made": last_run.get("api_calls_made", 0),
            "errors": last_run.get("errors", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading research status: {e}")
