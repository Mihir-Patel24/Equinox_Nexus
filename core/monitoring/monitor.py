"""
Continuous Monitor — Equinox Nexus v3.1
Watches FX rates and detects financial drift for all active twins.
Runs as a FastAPI background task.
Uses the free exchangerate-api.com endpoint (no API key required for base rates).

v3.1 change: On high-severity drift, triggers AutoResimEngine instead of
             incorrectly retraining the Prophet model.
"""

import asyncio
import httpx
import os
import threading
from typing import Dict, Any, Optional
from datetime import datetime


class ContinuousMonitor:
    """
    Background monitoring service.
    Polls FX rates and compares against rates at the time of each simulation.
    On high-severity drift, autonomously re-runs the agent pipeline for the
    affected twin and generates a structured drift explanation.
    """

    FX_DRIFT_THRESHOLD_PCT = 5.0       # Alert if FX moves >5% since last simulation
    POLL_INTERVAL_SECONDS  = 1800      # 30 minutes
    FX_URL = "https://api.exchangerate-api.com/v4/latest/USD"

    def __init__(self):
        self._running    = False
        self._latest_fx: Dict[str, float] = {}
        self._last_poll: Optional[datetime] = None

    async def fetch_fx_rates(self) -> Dict[str, float]:
        """Fetch latest USD-based exchange rates from free API."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self.FX_URL)
                if resp.status_code == 200:
                    rates = resp.json().get("rates", {})
                    self._latest_fx  = rates
                    self._last_poll  = datetime.utcnow()
                    return rates
        except Exception as e:
            print(f"Monitor: FX fetch error — {e}")
        return self._latest_fx  # Return cached if fetch fails

    async def check_all_twins(self) -> None:
        """
        Check all active twins for drift after an FX update.
        If high-severity drift is detected, triggers autonomous re-simulation
        via AutoResimEngine (runs in a daemon thread — non-blocking).
        """
        try:
            from twin.twin_store import get_all_twins, save_twin
            twins = get_all_twins()

            if not twins:
                return

            current_fx = self._latest_fx
            if not current_fx:
                return

            for twin_id, twin in twins.items():
                try:
                    drift_alerts = twin.detect_drift(current_fx=current_fx)
                    for alert in drift_alerts:
                        # Deduplicate: only add if not already alerted for same type+currency
                        recent_types = [a.get("type") for a in twin.alerts[-5:]]
                        if alert.get("type") not in recent_types:
                            twin.add_alert(alert)
                            print(
                                f"Monitor: Alert -> twin {twin_id} -- "
                                f"{alert.get('type')}: {alert.get('message', '')[:70]}"
                            )

                    # Save alert-enriched twin before triggering re-sim
                    if drift_alerts:
                        save_twin(twin)

                    # ── Autonomous re-simulation on high-severity drift ────────
                    if any(a.get("severity") == "high" for a in drift_alerts):
                        self._trigger_auto_resim(twin_id, twin, drift_alerts)

                except Exception as e:
                    print(f"Monitor: Error checking twin {twin_id} — {e}")

        except Exception as e:
            print(f"Monitor: Twin check error — {e}")

    def _trigger_auto_resim(
        self,
        twin_id: str,
        twin,
        drift_alerts: list,
    ) -> None:
        """
        Spawn a daemon thread to autonomously re-simulate the affected twin.
        Non-blocking — the monitor loop continues immediately.

        Replaces the incorrect trigger_learning_pipeline() from v3.0 which
        was retraining the Prophet model instead of re-running the agent pipeline.
        """
        try:
            from agents.auto_resim import AutoResimEngine
            engine = AutoResimEngine()
            ok, reason = engine.should_resim(twin, drift_alerts)

            if not ok:
                print(f"Monitor: Auto-resim skipped for twin {twin_id} — {reason}")
                return

            print(
                f"Monitor: Triggering auto-resim for twin {twin_id} "
                f"({reason}) in background thread..."
            )
            t = threading.Thread(
                target=engine.resimulate_and_update,
                args=(twin, drift_alerts, self._latest_fx),
                daemon=True,
            )
            t.start()

        except Exception as e:
            print(f"Monitor: Failed to trigger auto-resim for twin {twin_id} — {e}")

    async def run_forever(self) -> None:
        """Main monitoring loop — runs as a FastAPI background task."""
        self._running = True
        print(f"Monitor: Starting continuous monitoring (interval: {self.POLL_INTERVAL_SECONDS}s)")

        while self._running:
            try:
                await self.fetch_fx_rates()
                await self.check_all_twins()
                print(
                    f"Monitor: Cycle complete at {datetime.utcnow().isoformat()[:19]} — "
                    f"{len(self._latest_fx)} currencies tracked"
                )
            except Exception as e:
                print(f"Monitor: Unexpected error — {e}")

            await asyncio.sleep(self.POLL_INTERVAL_SECONDS)

    def stop(self) -> None:
        """Signal the monitoring loop to stop."""
        self._running = False

    def get_status(self) -> Dict[str, Any]:
        """Return current monitor status."""
        return {
            "running":                self._running,
            "last_poll":              self._last_poll.isoformat() if self._last_poll else None,
            "currencies_tracked":     len(self._latest_fx),
            "poll_interval_minutes":  self.POLL_INTERVAL_SECONDS // 60,
        }

    def get_latest_fx(self) -> Dict[str, float]:
        """Return the most recently fetched FX rates."""
        return self._latest_fx


# Singleton monitor instance
_monitor: Optional[ContinuousMonitor] = None


def get_monitor() -> ContinuousMonitor:
    global _monitor
    if _monitor is None:
        _monitor = ContinuousMonitor()
    return _monitor
