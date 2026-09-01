"""
PlannerNode — Equinox Nexus v3.1
Adaptive Agentic Orchestration Layer.

Responsibility:
  Inspect the Financial Twin's current state and the incoming simulation
  request to determine the minimal set of agents that need to run.
  Write an agent_plan into the state so run_parallel_agents executes
  only the required agents — not blindly all three every time.

Planning rules:
  ┌──────────────┬─────────────────────────────────────────────────────────┐
  │ Agent        │ Skip if...                                              │
  ├──────────────┼─────────────────────────────────────────────────────────┤
  │ Actuary      │ Same city + last QoL data < ACTUARY_FRESHNESS_DAYS old  │
  │ Fiscal Ghost │ Always run (FX rates change continuously)               │
  │ Nexus        │ Same country + compliance data < NEXUS_FRESHNESS_DAYS   │
  └──────────────┴─────────────────────────────────────────────────────────┘

  Chronos and Decision Intelligence always run — they depend on fresh
  expense + compliance data from this cycle's agents.

Design principles:
  - Non-destructive: if cached data is reused, it is re-injected into state
    so downstream nodes (Chronos, DI, Aggregator) still have valid data.
  - Transparent: the plan is recorded in agent_plan and surfaced in the
    API response so the frontend can show "Using cached compliance data".
  - Fail-safe: any error in the planner causes ALL agents to run (safe default).
"""

import sys
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── Freshness thresholds ──────────────────────────────────────────────────────
ACTUARY_FRESHNESS_DAYS = 30   # QoL indicators are stable over ~1 month
NEXUS_FRESHNESS_DAYS   = 7    # Tax/compliance rules change slowly


class PlannerNode:
    """
    Reads the Financial Twin's simulation history to decide which agents
    to run vs which can reuse cached data from a prior simulation.
    """

    def plan(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Determine which agents must run for this simulation cycle.

        Returns a state update dict containing:
          - agent_plan: the routing decision
          - (optionally) pre-populated agent outputs from cache
        """
        target_city = state.get("target_city", "").strip()
        twin_id     = state.get("twin_id")

        # Default: run everything
        plan = self._all_agents_plan("no_twin_id" if not twin_id else "initial")

        if not twin_id:
            return {"agent_plan": plan}

        try:
            from twin.twin_store import get_twin
            twin = get_twin(twin_id)

            if not twin or not twin.simulation_history:
                plan = self._all_agents_plan("first_simulation")
                return {"agent_plan": plan}

            last = twin.simulation_history[-1]
            last_city    = last.target_city.strip()
            last_country = self._extract_country(last_city)
            this_country = self._extract_country(target_city)

            now = datetime.utcnow()
            days_since_last = (now - last.timestamp).days

            agents_to_run:   List[str] = []
            agents_skipped:  List[str] = []
            plan_metadata:   Dict[str, Any] = {}

            # ── Actuary decision ─────────────────────────────────────────────
            actuary_fresh = (
                self._same_city(last_city, target_city)
                and days_since_last < ACTUARY_FRESHNESS_DAYS
                and last.quality_of_life_score > 0
            )
            if actuary_fresh:
                agents_skipped.append("actuary")
                plan_metadata["actuary"] = {
                    "status":  "skipped",
                    "reason":  f"Same city, QoL data {days_since_last}d old < {ACTUARY_FRESHNESS_DAYS}d threshold",
                    "cached_score": last.quality_of_life_score,
                    "data_age_days": days_since_last,
                }
                print(
                    f"[Planner] Actuary SKIPPED for {target_city} "
                    f"(cached QoL {last.quality_of_life_score:.0f}, {days_since_last}d old)"
                )
            else:
                agents_to_run.append("actuary")
                reason = (
                    "city_changed"   if not self._same_city(last_city, target_city)
                    else "data_stale" if days_since_last >= ACTUARY_FRESHNESS_DAYS
                    else "first_run"
                )
                plan_metadata["actuary"] = {"status": "run", "reason": reason}

            # ── Fiscal Ghost decision ─────────────────────────────────────────
            # Always run — FX rates change continuously and are the primary
            # input to expense projection.
            agents_to_run.append("fiscal_ghost")
            plan_metadata["fiscal_ghost"] = {
                "status": "run",
                "reason": "always_run (FX rates change continuously)",
            }

            # ── Nexus decision ────────────────────────────────────────────────
            nexus_fresh = (
                self._same_country(last_country, this_country)
                and days_since_last < NEXUS_FRESHNESS_DAYS
            )
            if nexus_fresh:
                agents_skipped.append("nexus")
                plan_metadata["nexus"] = {
                    "status":       "skipped",
                    "reason":       f"Same country ({this_country}), compliance data {days_since_last}d old < {NEXUS_FRESHNESS_DAYS}d threshold",
                    "data_age_days": days_since_last,
                    "country":      this_country,
                }
                print(
                    f"[Planner] Nexus SKIPPED for {target_city} "
                    f"(same country={this_country}, {days_since_last}d old)"
                )
            else:
                agents_to_run.append("nexus")
                reason = (
                    "country_changed" if not self._same_country(last_country, this_country)
                    else "data_stale"  if days_since_last >= NEXUS_FRESHNESS_DAYS
                    else "first_run"
                )
                plan_metadata["nexus"] = {"status": "run", "reason": reason}

            plan = {
                "agents_to_run":  agents_to_run,
                "agents_skipped": agents_skipped,
                "plan_metadata":  plan_metadata,
                "planned_at":     now.isoformat(),
                "days_since_last_sim": days_since_last,
                "same_city":     self._same_city(last_city, target_city),
                "same_country":  self._same_country(last_country, this_country),
            }

            # ── Re-inject cached outputs for skipped agents ───────────────────
            cached_state: Dict[str, Any] = {"agent_plan": plan}

            if "actuary" in agents_skipped:
                cached_result = last.full_result.get("risk_analysis") or {}
                if cached_result:
                    cached_state["risk_analysis"] = {
                        **cached_result,
                        "_cached": True,
                        "_cache_age_days": days_since_last,
                    }
                    cached_state.setdefault("agent_reasoning", [])
                    # agent_reasoning is Annotated[List, operator.add] — return as list
                    cached_state["agent_reasoning"] = [{
                        "agent":  "actuary",
                        "status": "cached",
                        "reason": plan_metadata["actuary"]["reason"],
                        "cache_age_days": days_since_last,
                        "cached_score": last.quality_of_life_score,
                    }]

            if "nexus" in agents_skipped:
                cached_result = last.full_result.get("compliance_analysis") or {}
                if cached_result:
                    cached_state["compliance_analysis"] = {
                        **cached_result,
                        "_cached": True,
                        "_cache_age_days": days_since_last,
                    }
                    existing_reasoning = cached_state.get("agent_reasoning", [])
                    cached_state["agent_reasoning"] = existing_reasoning + [{
                        "agent":  "nexus",
                        "status": "cached",
                        "reason": plan_metadata["nexus"]["reason"],
                        "cache_age_days": days_since_last,
                        "country": this_country,
                    }]

            print(
                f"[Planner] Plan => run: {agents_to_run}, "
                f"skip: {agents_skipped} | {target_city}"
            )
            return cached_state

        except Exception as e:
            print(f"[Planner] Error during planning ({e}) — defaulting to run all agents")
            return {"agent_plan": self._all_agents_plan(f"planner_error: {e}")}

    # ── Private helpers ────────────────────────────────────────────────────────

    def _all_agents_plan(self, reason: str) -> Dict[str, Any]:
        """Return a plan that runs all three agents (safe default)."""
        return {
            "agents_to_run":  ["actuary", "fiscal_ghost", "nexus"],
            "agents_skipped": [],
            "plan_metadata": {
                "actuary":      {"status": "run", "reason": reason},
                "fiscal_ghost": {"status": "run", "reason": reason},
                "nexus":        {"status": "run", "reason": reason},
            },
            "planned_at":     datetime.utcnow().isoformat(),
            "days_since_last_sim": None,
            "same_city":     False,
            "same_country":  False,
        }

    @staticmethod
    def _extract_country(city_str: str) -> str:
        """
        Extract country portion from 'City, Country' string.
        Returns lowercase for comparison.
        """
        parts = city_str.split(",")
        if len(parts) >= 2:
            return parts[-1].strip().lower()
        return city_str.strip().lower()

    @staticmethod
    def _same_city(city_a: str, city_b: str) -> bool:
        """True if both strings refer to the same city (case-insensitive, first token)."""
        def _normalise(s: str) -> str:
            return s.lower().split(",")[0].strip()
        return _normalise(city_a) == _normalise(city_b)

    @staticmethod
    def _same_country(country_a: str, country_b: str) -> bool:
        """True if both country strings match (case-insensitive)."""
        return country_a.strip().lower() == country_b.strip().lower()
