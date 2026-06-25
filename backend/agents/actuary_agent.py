"""
The Actuary (Risk Agent)
Analyzes non-financial "Life Quality" data including AQI, healthcare, safety
"""

from typing import Dict, Any
import asyncio
import requests

class ActuaryAgent:
    """
    Specializes in life quality risk assessment
    """
    
    def __init__(self):
        self.aqi_api_key = "your_aqi_api_key"
        self.safety_api_key = "your_safety_api_key"
    
    async def analyze_life_quality(self, context) -> Dict[str, Any]:
        """
        Analyze life quality factors for target locations
        """
        results = {}
        
        for location in context.target_locations:
            # Simulate API calls (replace with real APIs)
            aqi_data = await self._get_air_quality(location)
            healthcare_data = await self._get_healthcare_metrics(location)
            safety_data = await self._get_safety_index(location)
            
            # Calculate composite risk score
            risk_score = self._calculate_risk_score(aqi_data, healthcare_data, safety_data)
            
            results[location] = {
                "air_quality_index": aqi_data.get("aqi", 50),
                "healthcare_wait_time": healthcare_data.get("wait_time_days", 7),
                "safety_index": safety_data.get("safety_score", 0.8),
                "composite_risk_score": risk_score,
                "health_impact": self._assess_health_impact(aqi_data, healthcare_data),
                "lifestyle_impact": self._assess_lifestyle_impact(safety_data, context.preferences)
            }
        
        return results
    
    async def _get_air_quality(self, location: str) -> Dict:
        """Fetch air quality data"""
        # Simulate API call
        await asyncio.sleep(0.1)
        return {"aqi": 45, "pm25": 12, "status": "good"}
    
    async def _get_healthcare_metrics(self, location: str) -> Dict:
        """Fetch healthcare system metrics"""
        await asyncio.sleep(0.1)
        return {"wait_time_days": 5, "quality_score": 0.85, "cost_index": 1.2}
    
    async def _get_safety_index(self, location: str) -> Dict:
        """Fetch safety and crime statistics"""
        await asyncio.sleep(0.1)
        return {"safety_score": 0.82, "crime_rate": 0.03, "political_stability": 0.9}
    
    def _calculate_risk_score(self, aqi_data: Dict, healthcare_data: Dict, safety_data: Dict) -> float:
        """Calculate composite risk score (0-1, lower is better)"""
        aqi_risk = min(aqi_data.get("aqi", 50) / 100, 1.0)
        healthcare_risk = min(healthcare_data.get("wait_time_days", 7) / 30, 1.0)
        safety_risk = 1 - safety_data.get("safety_score", 0.8)
        
        return (aqi_risk * 0.3 + healthcare_risk * 0.3 + safety_risk * 0.4)
    
    def _assess_health_impact(self, aqi_data: Dict, healthcare_data: Dict) -> str:
        """Generate health impact assessment"""
        aqi = aqi_data.get("aqi", 50)
        if aqi > 100:
            return "High respiratory health risk due to poor air quality"
        elif aqi > 50:
            return "Moderate health impact from air pollution"
        else:
            return "Minimal health risk from environmental factors"
    
    def _assess_lifestyle_impact(self, safety_data: Dict, preferences: Dict) -> str:
        """Assess impact on lifestyle preferences"""
        safety_score = safety_data.get("safety_score", 0.8)
        
        if safety_score < 0.6:
            return "Significant lifestyle restrictions due to safety concerns"
        elif safety_score < 0.8:
            return "Some lifestyle adjustments needed for safety"
        else:
            return "Minimal impact on current lifestyle"