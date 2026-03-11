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

    # STEP 1 — Get city/state from ZIP
    geo = requests.get(f"https://api.zippopotam.us/us/{zip_code}")

    if geo.status_code != 200:
        return {"error": "Invalid ZIP code"}

    geo_data = geo.json()

    city = geo_data["places"][0]["place name"]
    state = geo_data["places"][0]["state abbreviation"]
    latitude = geo_data["places"][0]["latitude"]
    longitude = geo_data["places"][0]["longitude"]

    # STEP 2 — Query Google Civic API
    address = f"{zip_code}"

    civic_url = (
        f"https://www.googleapis.com/civicinfo/v2/representatives"
        f"?address={address}&key={API_KEY}"
    )

    civic = requests.get(civic_url)

    civic_data = civic.json()

    senators = []
    representatives = []

    offices = civic_data.get("offices", [])
    officials = civic_data.get("officials", [])

    for office in offices:

        if "Senate" in office["name"]:
            for index in office["officialIndices"]:
                person = officials[index]

                senators.append({
                    "name": person.get("name", ""),
                    "party": person.get("party", ""),
                    "phone": person.get("phones", ["N/A"])[0],
                    "website": person.get("urls", [""])[0]
                })

        if "House of Representatives" in office["name"]:
            for index in office["officialIndices"]:
                person = officials[index]

                representatives.append({
                    "name": person.get("name", ""),
                    "party": person.get("party", ""),
                    "phone": person.get("phones", ["N/A"])[0],
                    "website": person.get("urls", [""])[0]
                })

    return {
        "zip": zip_code,
        "city": city,
        "state": state,
        "latitude": latitude,
        "longitude": longitude,
        "senators": senators,
        "representatives": representatives
    }
