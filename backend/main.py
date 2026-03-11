from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = "AIzaSyBl0fzmbj2TB-i7ZWMI2ePtt8rTHR-LChM"


@app.get("/")
def home():
    return {"message": "EagleReach API running"}


@app.get("/zip/{zip_code}")
def get_zip_data(zip_code: str):

    try:

        # STEP 1 — Convert ZIP → City/State
        geo = requests.get(f"https://api.zippopotam.us/us/{zip_code}")

        if geo.status_code != 200:
            return {"error": "Invalid ZIP"}

        geo_data = geo.json()

        city = geo_data["places"][0]["place name"]
        state = geo_data["places"][0]["state abbreviation"]
        latitude = geo_data["places"][0]["latitude"]
        longitude = geo_data["places"][0]["longitude"]

        # STEP 2 — Build full address
        address = f"{city}, {state} {zip_code}"

        # STEP 3 — Query Google Civic API
        civic_url = (
            "https://www.googleapis.com/civicinfo/v2/representatives"
            f"?address={address}&levels=country&roles=legislatorUpperBody&roles=legislatorLowerBody&key={API_KEY}"
        )

        civic = requests.get(civic_url)
        civic_data = civic.json()

        senators = []
        representatives = []

        officials = civic_data.get("officials", [])

        for person in officials:

            office_name = person.get("office", "")

            entry = {
                "name": person.get("name", ""),
                "party": person.get("party", ""),
                "phone": person.get("phones", ["N/A"])[0],
                "website": person.get("urls", [""])[0]
            }

            if "Senate" in office_name:
                senators.append(entry)

            else:
                representatives.append(entry)

        return {
            "zip": zip_code,
            "city": city,
            "state": state,
            "latitude": latitude,
            "longitude": longitude,
            "senators": senators,
            "representatives": representatives
        }

    except Exception as e:

        return {
            "error": str(e),
            "zip": zip_code,
            "senators": [],
            "representatives": []
        }
