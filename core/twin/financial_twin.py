"""
Financial Twin — Equinox Nexus v3.0
Persistent digital representation of a user's financial life.
Stores simulation history, detects drift, evolves over time.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid


@dataclass
class SimulationRecord:
    """One completed simulation result stored in the twin's history."""
    simulation_id: str
    target_city: str
    timestamp: datetime
    viability_score: float
    net_annual_savings: float
    effective_tax_rate: float
    col_multiplier: float
    quality_of_life_score: float
    fx_rate_at_time: Dict[str, float]  # currency → rate at simulation time
    full_result: Dict[str, Any]         # complete API response


@dataclass
class FinancialTwin:
    """
    The living Financial Digital Twin of a user.
    Grows with each simulation and can detect financial drift over time.
    """
    twin_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    user_profile: Dict[str, Any] = field(default_factory=dict)
    simulation_history: List[SimulationRecord] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_updated: datetime = field(default_factory=datetime.utcnow)
    profile_version: int = 0
    alerts: List[Dict[str, Any]] = field(default_factory=list)

    def update_with_result(
        self,
        result: Dict[str, Any],
        target_city: str,
        fx_snapshot: Optional[Dict[str, float]] = None,
    ) -> None:
        """
        Add a new simulation result to the twin's history.

        Args:
            result:      Full LangGraph state dict from the agent pipeline.
            target_city: The city that was simulated.
            fx_snapshot: Current FX rates captured at simulation time.
                         Used later by detect_drift() to compare against
                         live rates and generate monetary alerts.
                         MUST be populated — passing None disables drift alerts.
        """
        final_report = result.get("final_report", {}) or {}

        # Capture the key currency pairs most relevant to this simulation.
        # We store a snapshot so the monitor can detect meaningful drift later.
        relevant_currencies = ["EUR", "GBP", "JPY", "SGD", "AED", "INR",
                                "AUD", "CAD", "CHF", "SEK", "NOK", "THB",
                                "KRW", "HKD", "MYR", "PLN", "CZK", "HUF"]
        fx_at_time = {}
        if fx_snapshot:
            for ccy in relevant_currencies:
                if ccy in fx_snapshot:
                    fx_at_time[ccy] = fx_snapshot[ccy]

        record = SimulationRecord(
            simulation_id=str(uuid.uuid4())[:8],
            target_city=target_city,
            timestamp=datetime.utcnow(),
            viability_score=final_report.get("relocation_viability_score", 0.0),
            net_annual_savings=final_report.get("net_annual_savings", 0.0),
            effective_tax_rate=final_report.get("effective_tax_rate", 0.0),
            col_multiplier=final_report.get("col_multiplier", 1.0),
            quality_of_life_score=final_report.get("quality_of_life_score", 0.0),
            fx_rate_at_time=fx_at_time,   # ← now correctly populated
            full_result=result,
        )
        self.simulation_history.append(record)
        self.last_updated = datetime.utcnow()
        self.profile_version += 1

    def get_city_history(self, city: str) -> List[SimulationRecord]:
        """Return all simulations for a specific city."""
        city_key = city.lower().split(",")[0].strip()
        return [
            r for r in self.simulation_history
            if r.target_city.lower().split(",")[0].strip() == city_key
        ]

    def get_best_city(self) -> Optional[str]:
        """Return the city with the highest average viability score."""
        if not self.simulation_history:
            return None
        scores: Dict[str, List[float]] = {}
        for record in self.simulation_history:
            city = record.target_city
            scores.setdefault(city, []).append(record.viability_score)
        avg_scores = {city: sum(v) / len(v) for city, v in scores.items()}
        return max(avg_scores, key=avg_scores.get)

    def detect_drift(self, current_fx: Optional[Dict[str, float]] = None) -> List[Dict[str, Any]]:
        """
        Detect if the financial landscape has materially changed since last simulation.
        Compares FX rates captured at simulation time against current live rates.
        Returns list of drift alert dicts sorted by severity (high first).
        """
        if not self.simulation_history:
            return []

        drift_alerts = []
        last = self.simulation_history[-1]
        time_since = (datetime.utcnow() - last.timestamp).days

        # Alert if simulation data is stale (>30 days old)
        if time_since > 30:
            drift_alerts.append({
                "type": "stale_simulation",
                "severity": "medium",
                "city": last.target_city,
                "days_since": time_since,
                "message": (
                    f"Last simulation for {last.target_city} was {time_since} days ago. "
                    f"Tax rates, CoL, and FX conditions may have materially changed."
                ),
                "recommendation": "Re-run simulation to get updated projections.",
            })

        # FX drift comparison — only works when fx_rate_at_time was populated
        if current_fx and last.fx_rate_at_time:
            for currency, old_rate in last.fx_rate_at_time.items():
                new_rate = current_fx.get(currency)
                if new_rate and old_rate > 0:
                    drift_pct = abs(new_rate - old_rate) / old_rate * 100
                    if drift_pct > 5.0:  # 5% threshold
                        direction = "weakened" if new_rate > old_rate else "strengthened"
                        drift_alerts.append({
                            "type": "fx_drift",
                            "severity": "high" if drift_pct > 10 else "medium",
                            "currency": currency,
                            "city": last.target_city,
                            "old_rate": round(old_rate, 4),
                            "new_rate": round(new_rate, 4),
                            "drift_pct": round(drift_pct, 2),
                            "direction": direction,
                            "message": (
                                f"{currency} has {direction} {drift_pct:.1f}% vs USD "
                                f"since your {last.target_city} simulation "
                                f"({old_rate:.4f} → {new_rate:.4f}). "
                                f"Your wealth projection in {currency} may have shifted significantly."
                            ),
                            "recommendation": (
                                f"Re-simulate {last.target_city} to refresh the {currency} "
                                f"wealth projection under current exchange conditions."
                            ),
                        })
        elif current_fx and not last.fx_rate_at_time:
            # Legacy records saved without FX snapshot — inform but don't alert
            drift_alerts.append({
                "type": "fx_snapshot_missing",
                "severity": "low",
                "city": last.target_city,
                "message": (
                    "FX rates were not captured at simulation time. "
                    "Re-run to enable live drift monitoring."
                ),
                "recommendation": "Re-run simulation to begin FX drift tracking.",
            })

        # Sort: high severity first
        severity_order = {"high": 0, "medium": 1, "low": 2}
        drift_alerts.sort(key=lambda a: severity_order.get(a.get("severity", "low"), 3))

        return drift_alerts

    def get_summary(self) -> Dict[str, Any]:
        """Return a concise summary of the twin's state."""
        cities_simulated = list({r.target_city for r in self.simulation_history})
        return {
            "twin_id": self.twin_id,
            "total_simulations": len(self.simulation_history),
            "cities_simulated": cities_simulated,
            "best_city": self.get_best_city(),
            "last_simulation": (
                self.simulation_history[-1].target_city
                if self.simulation_history else None
            ),
            "last_updated": self.last_updated.isoformat(),
            "profile_version": self.profile_version,
            "active_alerts": len(self.alerts),
        }

    def add_alert(self, alert: Dict[str, Any]) -> None:
        """Add a monitoring alert to the twin."""
        alert["timestamp"] = datetime.utcnow().isoformat()
        self.alerts.append(alert)
        # Keep last 50 alerts
        if len(self.alerts) > 50:
            self.alerts = self.alerts[-50:]

    def to_dict(self) -> Dict[str, Any]:
        """Serialize twin for API response."""
        return {
            "twin_id": self.twin_id,
            "user_profile": self.user_profile,
            "summary": self.get_summary(),
            "simulation_history": [
                {
                    "simulation_id": r.simulation_id,
                    "target_city": r.target_city,
                    "timestamp": r.timestamp.isoformat(),
                    "viability_score": r.viability_score,
                    "net_annual_savings": r.net_annual_savings,
                    "effective_tax_rate": r.effective_tax_rate,
                    "quality_of_life_score": r.quality_of_life_score,
                }
                for r in self.simulation_history
            ],
            "alerts": self.alerts[-10:],  # Last 10 alerts
        }
