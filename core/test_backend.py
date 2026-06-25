import requests
import json
import time

def test_api():
    url = "http://localhost:8000/simulate"
    
    payload = {
        "current_city": "San Francisco",
        "target_city": "Lisbon",
        "user_profile": {
            "annual_income": 120000,
            "monthly_expenses": 4000,
            "current_wealth": 50000
        }
    }
    
    print(f"Testing API at {url}...")
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        print("Success! Response:")
        print(json.dumps(data, indent=2))
        
        # Validation
        if data["status"] == "success" and data["data"]["final_report"]:
            print("VERIFICATION PASSED: Graph executed successfully.")
        else:
            print("VERIFICATION FAILED: Invalid response structure.")
            
    except Exception as e:
        print(f"Error: {e}")
        try:
            print(response.text)
        except:
            pass

if __name__ == "__main__":
    # Give uvicorn a moment to start
    # time.sleep(2) 
    test_api()
