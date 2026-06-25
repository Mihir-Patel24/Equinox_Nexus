"""
The Fiscal Ghost (Expense Agent)
Replays specific spending habits in new city's local prices
"""

from typing import Dict, Any, List
import asyncio

class FiscalGhostAgent:
    """
    Specializes in expense analysis and cost-of-living simulation
    """
    
    def __init__(self):
        self.cost_api_key = "your_cost_api_key"
        self.exchange_api_key = "your_exchange_api_key"
    
    async def analyze_expenses(self, context) -> Dict[str, Any]:
        """
        Analyze and replay spending patterns in target locations
        """
        results = {}
        
        # Extract spending patterns from financial data
        spending_profile = self._extract_spending_profile(context.financial_data)
        
        for location in context.target_locations:
            # Get local pricing data
            local_prices = await self._get_local_prices(location)
            exchange_rate = await self._get_exchange_rate(context.currency, location)
            
            # Replay spending habits with local prices
            projected_expenses = self._replay_expenses(spending_profile, local_prices, exchange_rate)
            
            # Calculate hidden costs
            hidden_costs = self._calculate_hidden_costs(location, context.salary)
            
            results[location] = {
                "monthly_expenses": projected_expenses,
                "hidden_costs": hidden_costs,
                "total_cost_increase": self._calculate_cost_delta(projected_expenses, spending_profile),
                "purchasing_power": self._calculate_purchasing_power(context.salary, projected_expenses, exchange_rate),
                "lifestyle_maintenance_cost": self._calculate_lifestyle_cost(spending_profile, local_prices)
            }
        
        return results
    
    def _extract_spending_profile(self, financial_data: Dict) -> Dict[str, float]:
        """Extract spending patterns from bank data"""
        if not financial_data:
            # Default spending profile
            return {
                "housing": 1200,
                "food_dining": 400,
                "transportation": 200,
                "entertainment": 300,
                "healthcare": 150,
                "shopping": 250,
                "utilities": 100,
                "coffee": 80,  # Specific brand tracking
                "gym": 50,     # Specific tier tracking
                "subscriptions": 75
            }
        
        # Process actual bank data (Plaid integration would go here)
        return financial_data.get("spending_categories", {})
    
    async def _get_local_prices(self, location: str) -> Dict[str, float]:
        """Fetch local pricing data from cost-of-living APIs"""
        await asyncio.sleep(0.1)  # Simulate API call
        
        # Mock data - replace with Zyla Cost of Living API
        return {
            "housing_index": 1.2,
            "food_index": 0.9,
            "transportation_index": 1.1,
            "entertainment_index": 1.0,
            "healthcare_index": 0.8,
            "coffee_price": 4.50,
            "gym_membership": 60,
            "utilities_index": 1.3
        }
    
    async def _get_exchange_rate(self, from_currency: str, to_location: str) -> float:
        """Get current exchange rate"""
        await asyncio.sleep(0.1)  # Simulate API call
        return 1.0  # Mock rate - replace with ExchangeRate-API
    
    def _replay_expenses(self, spending_profile: Dict, local_prices: Dict, exchange_rate: float) -> Dict[str, float]:
        """Replay user's specific spending habits with local prices"""
        projected = {}
        
        # Apply local price indices to spending categories
        projected["housing"] = spending_profile.get("housing", 0) * local_prices.get("housing_index", 1.0)
        projected["food_dining"] = spending_profile.get("food_dining", 0) * local_prices.get("food_index", 1.0)
        projected["transportation"] = spending_profile.get("transportation", 0) * local_prices.get("transportation_index", 1.0)
        projected["entertainment"] = spending_profile.get("entertainment", 0) * local_prices.get("entertainment_index", 1.0)
        projected["healthcare"] = spending_profile.get("healthcare", 0) * local_prices.get("healthcare_index", 1.0)
        
        # Specific brand/service tracking
        projected["coffee"] = (spending_profile.get("coffee", 0) / 3.50) * local_prices.get("coffee_price", 3.50)
        projected["gym"] = local_prices.get("gym_membership", 50)
        
        # Apply exchange rate
        for category in projected:
            projected[category] *= exchange_rate
        
        return projected
    
    def _calculate_hidden_costs(self, location: str, salary: float) -> Dict[str, float]:
        """Calculate bureaucracy and compliance costs"""
        return {
            "visa_fees": 500,
            "apostille_costs": 200,
            "translation_fees": 300,
            "health_insurance_surcharge": salary * 0.02,  # 2% surcharge for foreigners
            "social_security_contributions": salary * 0.15,  # EU/LatAm social solidarity
            "banking_setup": 150,
            "legal_consultation": 800
        }
    
    def _calculate_cost_delta(self, projected: Dict, current: Dict) -> float:
        """Calculate percentage change in total expenses"""
        projected_total = sum(projected.values())
        current_total = sum(current.values())
        
        if current_total == 0:
            return 0
        
        return ((projected_total - current_total) / current_total) * 100
    
    def _calculate_purchasing_power(self, salary: float, expenses: Dict, exchange_rate: float) -> float:
        """Calculate purchasing power in new location"""
        total_expenses = sum(expenses.values())
        net_income = (salary * exchange_rate) - total_expenses
        return net_income / salary if salary > 0 else 0
    
    def _calculate_lifestyle_cost(self, spending_profile: Dict, local_prices: Dict) -> Dict[str, Any]:
        """Calculate cost to maintain current social life"""
        social_costs = {
            "craft_beers_monthly": 3 * 4 * 8.50 * local_prices.get("entertainment_index", 1.0),  # 3 beers/week
            "tennis_court_monthly": 4 * 25 * local_prices.get("entertainment_index", 1.0),  # Weekly tennis
            "monthly_flight_home": 400,  # Maintain connections
            "social_dining": spending_profile.get("food_dining", 0) * 0.6  # 60% is social
        }
        
        return {
            "monthly_social_cost": sum(social_costs.values()),
            "breakdown": social_costs,
            "social_friction_factor": 1.2  # 20% premium for maintaining social life abroad
        }