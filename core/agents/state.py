"""
AgentState — Equinox Nexus v3.1
Supports parallel agent execution via Annotated reducers.
All agent outputs use operator.add merge so parallel branches
can write independently without clobbering each other.

v3.1 addition: agent_plan field for adaptive orchestration.
  The PlannerNode writes the plan; run_parallel_agents reads it
  to skip agents whose cached data is still fresh.
"""

from typing import TypedDict, List, Dict, Any, Optional, Annotated
import operator


def _last(a, b):
    """Reducer: keep the latest non-None value."""
    return b if b is not None else a


class AgentState(TypedDict):
    # ── Identity ────────────────────────────────────────────────────
    twin_id: Optional[str]              # Persistent digital twin ID
    session_id: Optional[str]           # Per-request session

    # ── User Input ──────────────────────────────────────────────────
    current_city: str
    target_city: str
    user_profile: Dict[str, Any]

    # ── Adaptive Orchestration Plan (written by PlannerNode) ─────────
    # agents_to_run:  list of agent names that must execute this cycle
    # agents_skipped: list of agents whose cached data is fresh enough
    # plan_metadata:  freshness / reason dict per agent decision
    agent_plan: Annotated[Optional[Dict[str, Any]], _last]

    # ── Agent Outputs (Annotated for parallel merge) ─────────────────
    # Each parallel branch writes its own key; no conflicts.
    risk_analysis: Annotated[Optional[Dict[str, Any]], _last]         # Actuary
    expense_analysis: Annotated[Optional[Dict[str, Any]], _last]      # Fiscal Ghost
    compliance_analysis: Annotated[Optional[Dict[str, Any]], _last]   # Nexus
    monte_carlo_result: Annotated[Optional[Dict[str, Any]], _last]    # Chronos
    payroll_analysis: Annotated[Optional[Dict[str, Any]], _last]      # Payroll Intel
    decision_intelligence: Annotated[Optional[Dict[str, Any]], _last] # Decision Intelligence

    # ── XAI Trace ───────────────────────────────────────────────────
    # Each agent appends its reasoning; operator.add concatenates lists
    agent_reasoning: Annotated[List[Dict[str, Any]], operator.add]

    # ── Final Output ────────────────────────────────────────────────
    final_report: Optional[Dict[str, Any]]
    wealth_projection: Optional[List[Dict[str, Any]]]
    xai_explanation: Optional[Dict[str, Any]]
    errors: Annotated[List[str], operator.add]
