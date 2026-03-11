from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_API_KEY = "AIzaSyBl0fzmbj2TB-i7ZWMI2ePtt8rTHR-LChM"


def get_representatives(address):

    url = "https://www.googleapis.com/civicinfo/v2/representatives"

    params = {
        "address": address,
        "key": GOOGLE_API_KEY
    }

    r = requests.get(url, params=params)
    data = r.json()

    senators = []
    representatives = []

    offices = data.get("offices", [])
    officials = data.get("officials", [])

    for office in offices:

        office_name = office.get("name", "")
        indices = office.get("officialIndices", [])

        for i in indices:

            if i >= len(officials):
                continue

            person = officials[i]

            info = {
                "name": person.get("name"),
                "party": person.get("party", ""),
                "phone": person.get("phones", [""])[0] if "phones" in person else "",
                "website": person.get("urls", [""])[0] if "urls" in person else ""
            }

            if "United States Senate" in office_name:
                senators.append(info)

            if "United States House of Representatives" in office_name:
                representatives.append(info)

    return senators, representatives


@app.get("/zip/{zip_code}")
def lookup_zip(zip_code: str):

    geo = requests.get(f"https://api.zippopotam.us/us/{zip_code}")

    if geo.status_code != 200:
        return {"error": "ZIP code not found"}

    geo_data = geo.json()

    city = geo_data["places"][0]["place name"]
    state = geo_data["places"][0]["state abbreviation"]
    lat = geo_data["places"][0]["latitude"]
    lon = geo_data["places"][0]["longitude"]

    # IMPORTANT FIX
    address = f"{zip_code}, {state}"

    senators, representatives = get_representatives(address)

    return {
        "zip": zip_code,
        "city": city,
        "state": state,
        "latitude": lat,
        "longitude": lon,
        "senators": senators,
        "representatives": representatives
    }
