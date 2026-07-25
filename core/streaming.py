"""
SSE Streaming endpoint for /simulate/stream — Equinox Nexus v3.1

Streams agent progress events to the frontend in real time so users see
each agent activating/completing instead of a blank loading screen.

Events emitted:
  { "type": "agent_start",    "agent": "actuary",  "message": "Scanning Singapore AQI..." }
  { "type": "agent_done",     "agent": "actuary",  "data": { ...actuary_result } }
  { "type": "simulation_complete", "data": { ...full_result } }
  { "type": "error",          "message": "..." }

Mount on FastAPI app with:
  from streaming import router as streaming_router
  app.include_router(streaming_router)
"""

import asyncio
import json
import time
import os
from typing import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()


class StreamRequest(BaseModel):
    current_city: str
    target_city: str
    annual_income: float
    currency: str = "USD"
    monthly_expenses: float | None = None
    current_wealth: float = 0.0
    lifestyle_preferences: dict = {}
    twin_id: str | None = None


def _sse(event_type: str, data: dict) -> str:
    """Format a Server-Sent Event line."""
    payload = json.dumps({"type": event_type, **data}, ensure_ascii=False)
    return f"data: {payload}\n\n"


async def _stream_simulation(req: StreamRequest) -> AsyncGenerator[str, None]:
    """
    Async generator that runs the full agent pipeline and yields SSE events
    as each agent completes.
    """
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    try:
        # ── Event 1: kick-off ─────────────────────────────────────────────────
        yield _sse("pipeline_start", {
            "message": f"Equinox Nexus initialising for {req.target_city}...",
            "city": req.target_city,
            "agents": ["actuary", "fiscal_ghost", "nexus_rag", "chronos", "decision_intelligence"],
            "timestamp": time.time()
        })
        await asyncio.sleep(0.1)

        # ── Parallel agents (Actuary + Fiscal Ghost + Nexus) ─────────────────
        yield _sse("agent_start", {
            "agent": "actuary",
            "message": f"The Actuary scanning AQI, healthcare & safety data for {req.target_city}...",
        })
        yield _sse("agent_start", {
            "agent": "fiscal_ghost",
            "message": f"Fiscal Ghost projecting cost of living in {req.target_city}...",
        })
        yield _sse("agent_start", {
            "agent": "nexus_rag",
            "message": f"The Nexus querying 52 compliance documents for {req.target_city}...",
        })
        await asyncio.sleep(0.15)

        # Run actual parallel agents
        from agents.actuary.actuary import ActuaryAgent
        from agents.fiscal_ghost.ghost import FiscalGhostAgent
        from agents.nexus.nexus import NexusAgent

        actuary = ActuaryAgent()
        ghost   = FiscalGhostAgent()
        nexus   = NexusAgent()

        user_profile = {
            "annual_income": req.annual_income,
            "monthly_expenses": req.monthly_expenses or (req.annual_income / 12 * 0.6),
            "currency": req.currency,
            "current_wealth": req.current_wealth,
        }

        # Run in thread executor so we don't block the event loop
        loop = asyncio.get_event_loop()

        actuary_task = loop.run_in_executor(None, actuary.analyze_risk, req.target_city)
        ghost_task   = loop.run_in_executor(
            None, ghost.calculate_expenses, user_profile, req.target_city
        )

        actuary_result, ghost_result = await asyncio.gather(actuary_task, ghost_task)

        yield _sse("agent_done", {
            "agent": "actuary",
            "message": f"Actuary complete — Risk: {actuary_result.get('overall_risk_rating', 'Medium')}, AQI: {actuary_result.get('air_quality_index', 'N/A')}",
            "data": actuary_result,
        })
        yield _sse("agent_done", {
            "agent": "fiscal_ghost",
            "message": f"Fiscal Ghost complete — Monthly burn: ${actuary_result.get('projected_expenses', 'N/A')}",
            "data": ghost_result,
        })

        # Nexus RAG
        nexus_task = loop.run_in_executor(None, nexus.analyze_compliance, user_profile, req.target_city)
        nexus_result = await nexus_task

        yield _sse("agent_done", {
            "agent": "nexus_rag",
            "message": f"Nexus complete — {len(str(nexus_result))} chars of compliance intelligence retrieved",
            "data": {"compliance_brief": str(nexus_result)[:500] + "..." if len(str(nexus_result)) > 500 else str(nexus_result)},
        })
        await asyncio.sleep(0.1)

        # ── Chronos Monte Carlo ───────────────────────────────────────────────
        yield _sse("agent_start", {
            "agent": "chronos",
            "message": f"Chronos running 1,000 Monte Carlo wealth paths for {req.target_city} with Prophet FX drift...",
        })

        from agents.chronos.chronos import ChronosAgent
        chronos = ChronosAgent()
        chronos_task = loop.run_in_executor(
            None,
            chronos.run_simulation,
            req.annual_income * 0.2,  # annual savings estimate
            req.current_wealth,
            req.target_city,
            req.currency,
        )
        chronos_result = await chronos_task

        scenarios = chronos_result.get("scenarios", [])
        base_scenario = next((s for s in scenarios if "Base" in s.get("name", "")), scenarios[0] if scenarios else {})

        yield _sse("agent_done", {
            "agent": "chronos",
            "message": f"Chronos complete — Base case 5yr wealth: ${int(base_scenario.get('year_5_wealth', 0)):,} | FX drift applied: {chronos_result.get('fx_drift_applied', False)}",
            "data": {
                "n_simulations": chronos_result.get("n_simulations", 1000),
                "base_year5": base_scenario.get("year_5_wealth"),
                "fx_drift_applied": chronos_result.get("fx_drift_applied", False),
                "scenarios": scenarios,
            },
        })
        await asyncio.sleep(0.1)

        # ── Decision Intelligence ─────────────────────────────────────────────
        yield _sse("agent_start", {
            "agent": "decision_intelligence",
            "message": "Decision Intelligence synthesising all agent outputs with Groq llama-3.3-70b-versatile...",
        })

        # Use the full LangGraph pipeline for the final result
        from main import app as fastapi_app
        # Call the /simulate endpoint logic directly
        from agents.graph import app as langgraph_app
        from agents.state import AgentState

        state: AgentState = {
            "twin_id": req.twin_id,
            "session_id": None,
            "current_city": req.current_city,
            "target_city": req.target_city,
            "user_profile": {
                "annual_income": req.annual_income,
                "currency": req.currency,
                "monthly_expenses": req.monthly_expenses or (req.annual_income / 12 * 0.6),
                "current_wealth": req.current_wealth,
                "lifestyle_preferences": req.lifestyle_preferences,
            },
            "risk_analysis": actuary_result,
            "expense_analysis": ghost_result,
            "compliance_analysis": nexus_result,
            "monte_carlo_result": chronos_result,
            "payroll_analysis": {},
            "decision_intelligence": {},
            "agent_reasoning": [],
            "final_report": {},
            "wealth_projection": [],
            "xai_explanation": None,
            "errors": [],
        }

        graph_task = loop.run_in_executor(None, lambda: langgraph_app.invoke(state))
        final_state = await graph_task

        di = final_state.get("decision_intelligence", {})
        report = final_state.get("final_report", {})
        viability = di.get("llm_viability_score") or report.get("relocation_viability_score", 70)

        yield _sse("agent_done", {
            "agent": "decision_intelligence",
            "message": f"Decision Intelligence complete — Viability score: {viability}/100",
            "data": {
                "viability_score": viability,
                "reasoning_preview": str(di.get("llm_reasoning", ""))[:200],
                "model_used": di.get("model_used", "Groq llama-3.3-70b-versatile"),
            },
        })
        await asyncio.sleep(0.1)

        # ── Complete ──────────────────────────────────────────────────────────
        yield _sse("simulation_complete", {
            "message": f"Simulation complete for {req.target_city}",
            "city": req.target_city,
            "data": {
                "risk_analysis": final_state.get("risk_analysis", actuary_result),
                "expense_analysis": final_state.get("expense_analysis", ghost_result),
                "compliance_analysis": final_state.get("compliance_analysis", {}),
                "monte_carlo_result": final_state.get("monte_carlo_result", chronos_result),
                "decision_intelligence": final_state.get("decision_intelligence", {}),
                "final_report": final_state.get("final_report", {}),
                "wealth_projection": final_state.get("wealth_projection", []),
                "xai_explanation": final_state.get("xai_explanation"),
            }
        })

    except Exception as e:
        yield _sse("error", {
            "message": str(e),
            "detail": "Simulation failed — check backend logs.",
        })


@router.post("/simulate/stream")
async def simulate_stream(req: StreamRequest):
    """
    SSE endpoint — streams agent progress events as the simulation runs.
    Frontend connects and receives events in real time.

    Usage (frontend):
      const es = new EventSource('/simulate/stream');
      // OR via fetch with POST body:
      const res = await fetch('http://localhost:8000/simulate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ... })
      });
      const reader = res.body.getReader();
    """
    return StreamingResponse(
        _stream_simulation(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",    # Disable nginx buffering
            "Connection": "keep-alive",
        },
    )
