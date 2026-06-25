from typing import TypedDict, List, Dict, Any, Optional
import operator

class AgentState(TypedDict):
    # User Input
    current_city: str
    target_city: str
    user_profile: Dict[str, Any]  # annual_income, monthly_expenses, currency, lifestyle_preferences, current_wealth

    # Agent Outputs
    risk_analysis: Optional[Dict[str, Any]]       # Actuary
    expense_analysis: Optional[Dict[str, Any]]    # Fiscal Ghost
    compliance_analysis: Optional[Dict[str, Any]] # Nexus

    # Final Output
    final_report: Optional[Dict[str, Any]]
    wealth_projection: Optional[List[Dict[str, Any]]]
    errors: List[str]
