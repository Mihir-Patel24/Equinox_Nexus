from typing import Dict, Any
from langgraph.graph import StateGraph, END
from .state import AgentState
from .actuary.actuary import ActuaryAgent
from .fiscal_ghost.ghost import FiscalGhostAgent
from .nexus.nexus import NexusAgent

# Initialize Agents
actuary = ActuaryAgent()
ghost = FiscalGhostAgent()
nexus = NexusAgent()

def run_actuary(state: AgentState):
    target = state["target_city"]
    result = actuary.analyze_risk(target)
    return {"risk_analysis": result}

def run_ghost(state: AgentState):
    target = state["target_city"]
    user = state["user_profile"]
    result = ghost.calculate_expenses(user, target)
    return {"expense_analysis": result}

def run_nexus(state: AgentState):
    target = state["target_city"]
    user = state["user_profile"]
    result = nexus.analyze_compliance(user, target)
    return {"compliance_analysis": result}

def aggregator(state: AgentState):
    print("Aggregating results...")

    income = state["user_profile"].get("annual_income", 60000)
    tax_info = state["compliance_analysis"]
    expense_info = state["expense_analysis"]
    risk_info = state["risk_analysis"]

    net_income = tax_info["net_annual_income"]
    annual_expenses = expense_info["projected_expenses"] * 12
    annual_savings = net_income - annual_expenses

    # 5-Year Projection with 5% investment return + 2% inflation adjustment
    projection = []
    current_wealth = state["user_profile"].get("current_wealth", 0)
    for year in range(1, 6):
        current_wealth = (current_wealth + annual_savings) * 1.05
        projection.append({
            "year": year,
            "wealth": round(current_wealth, 2),
            "city": state["target_city"]
        })

    # Quality score: blend safety + healthcare + inverse AQI
    aqi = risk_info.get("air_quality_index", 75)
    safety = risk_info.get("safety_score", 65)
    healthcare = risk_info.get("healthcare_score", 70)
    quality_score = round(((safety + healthcare) / 2 + max(0, 100 - aqi)) / 2, 1)

    # Relocation Viability Score (0-100)
    tax_penalty = tax_info["effective_rate"] * 100
    cost_delta = ((expense_info["projected_expenses"] - expense_info["original_expenses"]) / max(expense_info["original_expenses"], 1)) * 100
    viability = round(max(0, 100 - tax_penalty * 0.3 - max(0, cost_delta) * 0.2 + quality_score * 0.3), 1)

    return {
        "final_report": {
            "net_annual_savings": round(annual_savings, 2),
            "net_annual_income": round(net_income, 2),
            "annual_expenses": round(annual_expenses, 2),
            "effective_tax_rate": tax_info["effective_rate"],
            "tax_regime": tax_info["tax_regime"],
            "quality_of_life_score": quality_score,
            "relocation_viability_score": viability,
            "risk_rating": risk_info["overall_risk_rating"],
            "aqi": aqi,
            "col_multiplier": expense_info["col_multiplier"],
            "expense_breakdown": expense_info["details"],
            "treaty_status": tax_info["treaty_status"],
            "dta_relief": tax_info["dta_relief_applied"],
            "data_sources": [
                risk_info.get("data_source", "Curated dataset"),
                expense_info.get("data_source", "Numbeo index"),
                tax_info.get("data_source", "OECD 2024")
            ]
        },
        "wealth_projection": projection
    }

# Define Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("actuary", run_actuary)
workflow.add_node("fiscal_ghost", run_ghost)
workflow.add_node("nexus", run_nexus)
workflow.add_node("aggregator", aggregator)

# Define Edges
# Parallel execution of agents
workflow.set_entry_point("actuary")
workflow.add_edge("actuary", "fiscal_ghost")
workflow.add_edge("fiscal_ghost", "nexus")
workflow.add_edge("nexus", "aggregator")
workflow.add_edge("aggregator", END)

# Compile
app = workflow.compile()
