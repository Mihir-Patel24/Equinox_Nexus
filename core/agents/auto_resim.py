"""
AutoResimEngine — Equinox Nexus v3.1
Autonomous re-simulation engine for the Financial Digital Twin loop.

Responsibility:
  When the ContinuousMonitor detects high-severity drift on an active twin,
  this engine decides whether a re-simulation is warranted, re-invokes the
  full LangGraph agent pipeline with the twin's saved profile, and persists
  the updated state — closing the OBSERVE → ANALYZE → SIMULATE → UPDATE loop.

Design principles:
  - Reads only from the existing twin state (no extra user input required).
  - Uses the SAME LangGraph graph_app.invoke() as the /simulate endpoint.
  - Thread-safe: called from the monitor's daemon thread.
  - Guarded against re-simulation storms (minimum interval + severity gate).
  - Non-destructive: adds a new SimulationRecord; never overwrites history.
"""

import sys
import os
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

# Ensure core/ is on the path when called from the monitor thread
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── Constants ────────────────────────────────────────────────────────────────
MIN_RESIM_INTERVAL_HOURS = 6   # prevent re-simulation storms
MIN_SEVERITY_FOR_RESIM   = "high"  # only re-sim on high-severity drift
_resim_lock = threading.Lock()     # prevent concurrent re-sims for the same twin


class AutoResimEngine:
    """
    Determines whether a Financial Twin should be autonomously re-simulated
    and, if so, executes the full agent pipeline on its behalf.
    """

    def should_resim(
        self,
        twin,
        drift_alerts: List[Dict[str, Any]],
    ) -> tuple[bool, str]:
        """
        Evaluate whether an autonomous re-simulation should be triggered.

        Returns:
            (True, reason)  → re-sim is warranted
            (False, reason) → skip with explanation
        """
        # Gate 1: twin must have at least one past simulation to replay
        if not twin.simulation_history:
            return False, "no_history"

        # Gate 2: at least one high-severity alert
        high_severity = [
            a for a in drift_alerts
            if a.get("severity") == MIN_SEVERITY_FOR_RESIM
        ]
        if not high_severity:
            return False, "no_high_severity_drift"

        # Gate 3: minimum interval since last re-simulation (check alerts log)
        last_resim_ts = None
        for alert in reversed(twin.alerts):
            if alert.get("type") == "auto_resimulation":
                ts_str = alert.get("timestamp")
                if ts_str:
                    try:
                        last_resim_ts = datetime.fromisoformat(ts_str)
                    except ValueError:
                        pass
                break

        if last_resim_ts:
            hours_since = (datetime.utcnow() - last_resim_ts).total_seconds() / 3600
            if hours_since < MIN_RESIM_INTERVAL_HOURS:
                return False, f"too_soon ({hours_since:.1f}h < {MIN_RESIM_INTERVAL_HOURS}h minimum)"

        # Gate 4: twin must have a user profile (needed to rebuild AgentState)
        profile = twin.user_profile or {}
        if not profile.get("annual_income"):
            return False, "incomplete_profile"

        return True, f"{len(high_severity)} high-severity drift alert(s)"

    def resimulate(self, twin) -> Dict[str, Any]:
        """
        Re-invoke the full LangGraph pipeline using the twin's saved profile
        and last-simulated city.  Returns the raw result dict from graph_app.

        This is intentionally synchronous — called from a daemon thread.
        """
        from agents.graph import app as graph_app
        from agents.state import AgentState

        last_sim   = twin.simulation_history[-1]
        profile    = twin.user_profile
        target_city = last_sim.target_city

        print(
            f"[AutoResim] Re-simulating twin {twin.twin_id} "
            f"=> {target_city} (triggered by FX drift)"
        )

        initial_state: AgentState = {
            "twin_id":    twin.twin_id,
            "session_id": None,
            "current_city": profile.get("current_city", ""),
            "target_city":  target_city,
            "user_profile": profile,

            # Planner will compute the plan at the start of the graph
            "agent_plan": None,

            # Clear all agent outputs — let them be freshly computed
            "risk_analysis":        None,
            "expense_analysis":     None,
            "compliance_analysis":  None,
            "monte_carlo_result":   None,
            "payroll_analysis":     None,
            "decision_intelligence": None,

            "agent_reasoning": [],
            "final_report":    None,
            "wealth_projection": None,
            "xai_explanation": None,
            "errors": [],
        }

        result = graph_app.invoke(initial_state)
        print(f"[AutoResim] Pipeline complete for twin {twin.twin_id}")
        return result

    def resimulate_and_update(
        self,
        twin,
        drift_alerts: List[Dict[str, Any]],
        current_fx: Dict[str, float],
    ) -> None:
        """
        Full autonomous loop (called in a daemon thread by the monitor):
          1. Re-run the agent pipeline
          2. Generate drift explanation (delta vs previous simulation)
          3. Persist updated twin with new SimulationRecord
          4. Add auto_resimulation alert to twin

        Thread-safe via _resim_lock (one re-sim per twin at a time).
        """
        twin_id = twin.twin_id

        if not _resim_lock.acquire(blocking=False):
            print(f"[AutoResim] Twin {twin_id} re-sim already in progress — skipping")
            return

        try:
            # ── Step 1: Re-run agents ─────────────────────────────────────────
            new_result = self.resimulate(twin)

            # ── Step 2: Generate drift explanation ────────────────────────────
            from twin.drift_explainer import DriftExplainer
            explainer = DriftExplainer()
            old_record = twin.simulation_history[-1]
            explanation = explainer.explain(old_record, new_result, drift_alerts)

            # ── Step 3: Persist updated twin ──────────────────────────────────
            from twin.twin_store import update_twin, get_twin, save_twin
            update_twin(twin_id, new_result, old_record.target_city, fx_snapshot=current_fx)

            # ── Step 4: Add structured alert ──────────────────────────────────
            # Reload from DB so we're working with the freshly-saved record
            refreshed_twin = get_twin(twin_id)
            if refreshed_twin:
                refreshed_twin.add_alert({
                    "type":        "auto_resimulation",
                    "severity":    "info",
                    "city":        old_record.target_city,
                    "triggered_by": [
                        a.get("message", "")[:80]
                        for a in drift_alerts
                        if a.get("severity") == "high"
                    ],
                    "drift_explanation": explanation,
                    "prev_viability": old_record.viability_score,
                    "new_viability":  (
                        new_result.get("final_report", {}) or {}
                    ).get("relocation_viability_score", 0),
                    "message": (
                        f"Twin auto-updated: {old_record.target_city} "
                        f"viability {old_record.viability_score:.1f} → "
                        f"{explanation.get('viability_delta', {}).get('after', '?')}"
                    ),
                })
                save_twin(refreshed_twin)

            print(
                f"[AutoResim] OK twin {twin_id} updated. "
                f"Viability: {old_record.viability_score:.1f} => "
                f"{explanation.get('viability_delta', {}).get('after', '?')}"
            )

        except Exception as e:
            print(f"[AutoResim] ERROR during re-simulation of twin {twin_id}: {e}")
        finally:
            _resim_lock.release()
