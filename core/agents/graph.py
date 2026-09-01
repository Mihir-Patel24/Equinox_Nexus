"""
LangGraph Orchestrator — Equinox Nexus v3.1

Architecture: Adaptive Fan-Out (Planner -> Conditional Parallel -> Sequential Fan-In)
─────────────────────────────────────────────────────────────────────────────
                    [entry]
                       |
                  [planner]                   <- reads twin history, writes agent_plan
                       |
         .-------------|------------.
         |             |            |
    [actuary?]  [fiscal_ghost]  [nexus?]      <- CONDITIONAL parallel (ThreadPool)
    (skipped if   (always runs)  (skipped if
     same city,                   same country,
     QoL fresh)                   compliance fresh)
         |             |            |
         `-------------|------------'
                       | (fan-in -- merge all results into state)
                       v
                   [chronos]                  <- depends on ghost + nexus output
                       |
                       v
          [decision_intelligence_agent]       <- Groq LLM synthesis
                       |
                       v
                  [aggregator]               <- XAI + final report
                       |
                      END
─────────────────────────────────────────────────────────────────────────────

Why ThreadPoolExecutor instead of LangGraph Send API?
  The Send API causes Pregel trigger channel collisions in this LangGraph version
  when multiple branches write to the same Annotated state keys simultaneously.
  ThreadPoolExecutor gives us true wall-clock parallelism with clean state merge.
  Net result: 3 agents run in parallel, cutting latency from ~8s to ~2-3s.

v3.1 change: PlannerNode inserted before the fan-out.
  Skipped agents reuse cached data from the twin's last SimulationRecord.
  This prevents unnecessary model calls when data is still fresh.
"""

from typing import Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from langgraph.graph import StateGraph, END
from .state import AgentState
from .actuary.actuary import ActuaryAgent
from .fiscal_ghost.ghost import FiscalGhostAgent
from .nexus.nexus import NexusAgent
from .chronos.chronos import ChronosAgent
from .decision_intelligence import DecisionIntelligenceAgent
from .planner import PlannerNode

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from xai.explainer import ViabilityExplainer

# ── Agent singletons (loaded once at startup) ────────────────────────────────
actuary   = ActuaryAgent()
ghost     = FiscalGhostAgent()
nexus     = NexusAgent()
chronos   = ChronosAgent()
decision_agent = DecisionIntelligenceAgent()
explainer = ViabilityExplainer()
_planner  = PlannerNode()


# ── PlannerNode Graph Function ──────────────────────────────────────────────

def run_planner(state: AgentState) -> Dict[str, Any]:
    """
    PlannerNode graph function.
    Reads the twin's history and writes agent_plan into state.
    Also re-injects cached agent outputs if any agents are skipped.
    """
    return _planner.plan(state)


# ── Individual Agent Functions (same logic as before) ───────────────────────

def _run_actuary(state: AgentState) -> Dict[str, Any]:
    """Actuary: Risk + Quality of Life analysis."""
    try:
        result = actuary.analyze_risk(state["target_city"])
        return {
            "risk_analysis": result,
            "agent_reasoning": [{
                "agent": "actuary",
                "output_keys": list(result.keys()),
                "data_source": result.get("data_source", "QoL model"),
                "city": state["target_city"],
            }],
            "errors": [],
        }
    except Exception as e:
        return {
            "risk_analysis": {
                "air_quality_index": 75, "safety_score": 65,
                "healthcare_score": 70, "happiness_index": 65,
                "composite_score": 65.0, "overall_risk_rating": "Medium",
                "data_source": "Fallback defaults",
            },
            "agent_reasoning": [{"agent": "actuary", "error": str(e)}],
            "errors": [f"Actuary error: {e}"],
        }


def _run_ghost(state: AgentState) -> Dict[str, Any]:
    """Fiscal Ghost: Expense modeling."""
    try:
        result = ghost.calculate_expenses(state["user_profile"], state["target_city"])
        return {
            "expense_analysis": result,
            "agent_reasoning": [{
                "agent": "fiscal_ghost",
                "projected_expenses": result.get("projected_expenses"),
                "col_multiplier": result.get("col_multiplier"),
                "lifestyle_model": result.get("lifestyle_model_used", "static"),
                "data_source": result.get("data_source", "XGBoost"),
                "city": state["target_city"],
            }],
            "errors": [],
        }
    except Exception as e:
        income = state["user_profile"].get("annual_income", 60000)
        fallback_exp = income / 12 * 0.65
        return {
            "expense_analysis": {
                "projected_expenses": round(fallback_exp, 2),
                "original_expenses": round(income / 12 * 0.6, 2),
                "col_multiplier": 1.0,
                "currency": "USD",
                "details": {},
                "data_source": "Fallback estimate",
            },
            "agent_reasoning": [{"agent": "fiscal_ghost", "error": str(e)}],
            "errors": [f"Fiscal Ghost error: {e}"],
        }


def _run_nexus(state: AgentState) -> Dict[str, Any]:
    """Nexus: RAG-powered compliance + tax intelligence."""
    try:
        result = nexus.analyze_compliance(state["user_profile"], state["target_city"])
        return {
            "compliance_analysis": result,
            "agent_reasoning": [{
                "agent": "nexus",
                "effective_rate": result.get("effective_rate"),
                "tax_regime": result.get("tax_regime"),
                "rag_sources": result.get("rag_sources", []),
                "rag_passage_count": result.get("rag_passage_count", 0),
                "data_source": result.get("data_source"),
            }],
            "errors": [],
        }
    except Exception as e:
        income = state["user_profile"].get("annual_income", 60000)
        return {
            "compliance_analysis": {
                "effective_rate": 0.30,
                "net_annual_income": round(income * 0.70, 2),
                "tax_regime": "Standard",
                "treaty_status": "unknown",
                "dta_relief_applied": 0.05,
                "visa_requirements": "Work Permit Required",
                "data_source": "Fallback defaults",
            },
            "agent_reasoning": [{"agent": "nexus", "error": str(e)}],
            "errors": [f"Nexus error: {e}"],
        }


def _merge_partial(base: AgentState, partial: Dict[str, Any]) -> None:
    """
    Merge a partial agent output dict back into the mutable state dict.
    Handles list keys (agent_reasoning, errors) with append semantics.
    """
    for key, value in partial.items():
        if key in ("agent_reasoning", "errors"):
            # Accumulate lists from parallel branches
            existing = base.get(key) or []
            if isinstance(value, list):
                base[key] = existing + value
            else:
                base[key] = existing
        else:
            # Last-write-wins for scalar/dict keys — each agent owns its own key
            if value is not None:
                base[key] = value


# ── Parallel Fan-Out Node ────────────────────────────────────────────────────

def run_parallel_agents(state: AgentState) -> Dict[str, Any]:
    """
    Run agents in parallel using a thread pool.
    Reads agent_plan to skip agents whose cached data is still fresh.
    """
    plan          = state.get("agent_plan") or {}
    agents_to_run = plan.get("agents_to_run", ["actuary", "fiscal_ghost", "nexus"])
    skipped       = plan.get("agents_skipped", [])

    print(f"[Parallel] Running: {agents_to_run} | Skipped: {skipped} for {state['target_city']}...")

    all_agent_fns = {
        "actuary":      _run_actuary,
        "fiscal_ghost": _run_ghost,
        "nexus":        _run_nexus,
    }
    
    agent_fns = {name: fn for name, fn in all_agent_fns.items() if name in agents_to_run}
    merged: Dict[str, Any] = {
        "agent_reasoning": [],
        "errors": [],
    }

    if not agent_fns:
        return merged

    with ThreadPoolExecutor(max_workers=len(agent_fns)) as executor:
        futures = {executor.submit(fn, state): name for name, fn in agent_fns.items()}

        for future in as_completed(futures):
            agent_name = futures[future]
            try:
                partial_result = future.result()
                _merge_partial(merged, partial_result)
                print(f"[Parallel] [OK] {agent_name} complete")
            except Exception as e:
                error_msg = f"{agent_name} thread error: {e}"
                merged["errors"].append(error_msg)
                merged["agent_reasoning"].append({"agent": agent_name, "error": error_msg, "status": "thread_exception"})
                print(f"[Parallel] [FAIL] {agent_name} failed: {e}")

    return merged


# ── Sequential Downstream Nodes ──────────────────────────────────────────────

def run_chronos(state: AgentState) -> Dict[str, Any]:
    """Chronos: Monte Carlo simulation. Depends on ghost + nexus output."""
    try:
        tax_info     = state.get("compliance_analysis") or {}
        expense_info = state.get("expense_analysis") or {}
        user         = state["user_profile"]

        net_income      = tax_info.get("net_annual_income", user.get("annual_income", 60000) * 0.7)
        annual_expenses = (expense_info.get("projected_expenses", 0) or 0) * 12
        annual_savings  = net_income - annual_expenses
        city_key        = state["target_city"].lower().split(",")[0].strip()

        result = chronos.run_simulation(
            annual_savings=annual_savings,
            current_wealth=user.get("current_wealth", 0),
            city_key=city_key,
            user_currency=user.get("currency", "USD"),
        )
        return {
            "monte_carlo_result": result,
            "agent_reasoning": [{
                "agent": "chronos",
                "n_simulations": result.get("n_simulations"),
                "prob_growth": result.get("final_year_stats", {}).get("probability_of_growth"),
                "fx_vol": result.get("risk_metrics", {}).get("fx_volatility_used"),
                "data_source": result.get("data_source"),
            }],
            "errors": [],
        }
    except Exception as e:
        return {
            "monte_carlo_result": {
                "simulation_paths": {"years": [1, 2, 3, 4, 5], "p5": [], "p25": [], "p50": [], "p75": [], "p95": []},
                "final_year_stats": {
                    "median_wealth": 0, "best_case_p95": 0, "worst_case_p5": 0,
                    "probability_of_growth": 50.0, "probability_of_doubling": 10.0,
                    "probability_of_significant_loss": 15.0,
                },
                "risk_metrics": {"fx_risk_level": "Medium", "fx_volatility_used": 0.08, "target_currency": "USD"},
                "scenarios": [],
                "data_source": "Fallback",
            },
            "agent_reasoning": [{"agent": "chronos", "error": str(e)}],
            "errors": [f"Chronos error: {e}"],
        }


def run_decision_intelligence(state: AgentState) -> Dict[str, Any]:
    """Decision Intelligence Agent: Groq LLM synthesis of all agent outputs."""
    try:
        result = decision_agent.synthesize_decision(state)
        reasoning_trace = {
            "agent": "decision_intelligence",
            "output_keys": list(result.keys()),
            "data_source": "Groq LLM (llama-3.3-70b-versatile)",
            "city": state["target_city"],
            "llm_score_produced": result.get("decision_viability_score") is not None,
        }
        return {
            "decision_intelligence": result,
            "agent_reasoning": [reasoning_trace],
            "errors": [],
        }
    except Exception as e:
        return {
            "decision_intelligence": {
                "decision_viability_score": None,
                "dynamic_reasoning": f"Decision Agent execution failed: {e}",
            },
            "agent_reasoning": [{"agent": "decision_intelligence", "error": str(e)}],
            "errors": [f"Decision Intelligence Agent error: {e}"],
        }


def aggregator(state: AgentState) -> Dict[str, Any]:
    """
    Aggregator: Combines all agent outputs into the final report.
    """
    print("Aggregator: Compiling final report...")

    tax_info     = state.get("compliance_analysis") or {}
    expense_info = state.get("expense_analysis") or {}
    risk_info    = state.get("risk_analysis") or {}
    mc           = state.get("monte_carlo_result") or {}
    user         = state.get("user_profile") or {}
    plan         = state.get("agent_plan") or {}

    net_income      = tax_info.get("net_annual_income", 0)
    proj_expenses   = expense_info.get("projected_expenses", 0) or 0
    annual_expenses = proj_expenses * 12
    annual_savings  = net_income - annual_expenses
    current_wealth  = user.get("current_wealth", 0)

    aqi        = risk_info.get("air_quality_index", 75) or 75
    safety     = risk_info.get("safety_score", 65) or 65
    healthcare = risk_info.get("healthcare_score", 70) or 70
    happiness  = risk_info.get("happiness_index", 65) or 65

    aqi_score     = max(0, 100 - aqi)
    quality_score = round((safety + healthcare + happiness + aqi_score) / 4, 1)

    xai_result = explainer.explain_viability(state)
    viability  = xai_result["viability_score"]

    di_info = state.get("decision_intelligence") or {}
    if di_info and di_info.get("decision_viability_score") is not None:
        viability = di_info["decision_viability_score"]
        xai_result["viability_score"] = viability

    projection = []
    w = current_wealth
    for year in range(1, 6):
        w = (w + annual_savings) * 1.07
        projection.append({"year": year, "wealth": round(w, 2), "city": state["target_city"]})

    mc_final = mc.get("final_year_stats", {})
    mc_risk  = mc.get("risk_metrics", {})

    final_report = {
        # Core financial metrics
        "net_annual_savings":  round(annual_savings, 2),
        "net_annual_income":   round(net_income, 2),
        "annual_expenses":     round(annual_expenses, 2),
        "monthly_expenses":    round(proj_expenses, 2),

        # Tax
        "effective_tax_rate":  tax_info.get("effective_rate", 0),
        "gross_tax_rate":      tax_info.get("gross_tax_rate", 0),
        "estimated_tax":       tax_info.get("estimated_tax", 0),
        "tax_regime":          tax_info.get("tax_regime", "Standard"),
        "dta_relief":          tax_info.get("dta_relief_applied", 0),
        "treaty_status":       tax_info.get("treaty_status", "unknown"),
        "treaty_label":        tax_info.get("treaty_label", ""),
        "visa_requirements":   tax_info.get("visa_requirements", "Work Permit"),
        "compliance_notes":    tax_info.get("compliance_notes", []),
        "rag_sources":         tax_info.get("rag_sources", []),

        # Quality of Life
        "quality_of_life_score": quality_score,
        "air_quality_index":   aqi,
        "safety_score":        safety,
        "healthcare_score":    healthcare,
        "happiness_index":     happiness,
        "risk_rating":         risk_info.get("overall_risk_rating", "Medium"),
        "actuary_notes":       risk_info.get("notes", ""),

        # Expenses
        "col_multiplier":      expense_info.get("col_multiplier", 1.0),
        "expense_breakdown":   expense_info.get("details", {}),
        "fx_rate":             expense_info.get("fx_rate", 1.0),
        "lifestyle_model":     expense_info.get("lifestyle_model_used", "static"),

        # Viability & XAI
        "relocation_viability_score":     viability,
        "viability_confidence_interval":  xai_result.get("confidence_interval", []),
        "viability_executive_summary":    xai_result.get("executive_summary", ""),
        "key_risks":                      xai_result.get("key_risks", []),
        "key_advantages":                 xai_result.get("key_advantages", []),

        # Monte Carlo
        "monte_carlo_median_wealth_yr5": mc_final.get("median_wealth", 0),
        "monte_carlo_worst_case_yr5":    mc_final.get("worst_case_p5", 0),
        "monte_carlo_best_case_yr5":     mc_final.get("best_case_p95", 0),
        "probability_of_growth":         mc_final.get("probability_of_growth", 50),
        "probability_of_doubling":       mc_final.get("probability_of_doubling", 10),
        "probability_of_loss":           mc_final.get("probability_of_significant_loss", 15),
        "fx_risk_level":                 mc_risk.get("fx_risk_level", "Medium"),
        "value_at_risk_5pct":            mc_risk.get("value_at_risk_5pct", 0),
        "city_inflation_rate":           mc_risk.get("city_inflation_rate", 0.03),

        # Adaptive orchestration transparency
        "agent_plan_summary": {
            "agents_run":     plan.get("agents_to_run", []),
            "agents_skipped": plan.get("agents_skipped", []),
            "days_since_last": plan.get("days_since_last_sim"),
            "same_city":      plan.get("same_city", False),
            "same_country":   plan.get("same_country", False),
        },

        # Data provenance
        "data_sources": [
            risk_info.get("data_source", "QoL model"),
            expense_info.get("data_source", "XGBoost"),
            tax_info.get("data_source", "OECD 2024"),
            mc.get("data_source", "Monte Carlo GBM"),
        ],
    }

    return {
        "final_report":     final_report,
        "wealth_projection": projection,
        "xai_explanation":  xai_result,
        "errors": [],
    }


# ── LangGraph: Planner -> Adaptive Parallel Fan-Out -> Sequential Fan-In ─────────────

workflow = StateGraph(AgentState)

workflow.add_node("planner",                    run_planner)
workflow.add_node("parallel_agents",            run_parallel_agents)
workflow.add_node("chronos",                    run_chronos)
workflow.add_node("decision_intelligence_agent", run_decision_intelligence)
workflow.add_node("aggregator",                 aggregator)

workflow.set_entry_point("planner")
workflow.add_edge("planner",                     "parallel_agents")
workflow.add_edge("parallel_agents",             "chronos")
workflow.add_edge("chronos",                     "decision_intelligence_agent")
workflow.add_edge("decision_intelligence_agent", "aggregator")
workflow.add_edge("aggregator",                  END)

app = workflow.compile()
