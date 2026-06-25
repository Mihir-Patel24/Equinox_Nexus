from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional

app = FastAPI(title="Equinox Flow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    current_location: str
    target_locations: List[str]
    current_salary: float
    currency: str
    lifestyle_preferences: Dict

@app.get("/")
async def root():
    return {"message": "Equinox Flow - Agentic Financial Digital Twin"}

@app.post("/simulate")
async def run_simulation(request: SimulationRequest):
    """Run the full agentic simulation"""
    return {
        "scenarios": [],
        "risk_analysis": {},
        "compliance_summary": {},
        "recommendations": []
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)