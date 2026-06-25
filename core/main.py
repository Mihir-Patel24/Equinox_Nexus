from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from agents.graph import app as graph_app
from agents.state import AgentState

app = FastAPI(title="Equinox Nexus Core", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Equinox Nexus Core is Online", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

class SimulationRequest(BaseModel):
    current_city: str
    target_city: str
    annual_income: float
    currency: str = "USD"
    monthly_expenses: Optional[float] = None
    current_wealth: Optional[float] = 0
    lifestyle_preferences: Optional[Dict[str, Any]] = {}

@app.post("/simulate")
async def simulate_relocation(request: SimulationRequest):
    initial_state: AgentState = {
        "current_city": request.current_city,
        "target_city": request.target_city,
        "user_profile": {
            "annual_income": request.annual_income,
            "monthly_expenses": request.monthly_expenses or (request.annual_income / 12 * 0.6),
            "currency": request.currency,
            "current_wealth": request.current_wealth or 0,
            "lifestyle_preferences": request.lifestyle_preferences or {}
        },
        "risk_analysis": None,
        "expense_analysis": None,
        "compliance_analysis": None,
        "final_report": None,
        "wealth_projection": None,
        "errors": []
    }

    try:
        result = graph_app.invoke(initial_state)
        return {
            "status": "success",
            "city": request.target_city,
            "data": {
                "final_report": result.get("final_report"),
                "wealth_projection": result.get("wealth_projection"),
                "risk_analysis": result.get("risk_analysis"),
                "expense_analysis": result.get("expense_analysis"),
                "compliance_analysis": result.get("compliance_analysis")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
