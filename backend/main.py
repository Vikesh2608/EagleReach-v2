from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

OPENSTATES_API_KEY = "6d06c12b-ce82-4b3a-9163-2dbf400a3105"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message":"EagleReach API Running"}

@app.get("/zip/{zipcode}")
def get_zip(zipcode:str):

    geo = requests.get(f"https://api.zippopotam.us/us/{zipcode}")

    if geo.status_code != 200:
        return {"error":"ZIP not found"}

    data = geo.json()

    city = data["places"][0]["place name"]
    state = data["places"][0]["state abbreviation"]

    legislators = requests.get(
        f"https://v3.openstates.org/people?jurisdiction=ocd-jurisdiction/country:us/state:{state.lower()}/government&apikey={OPENSTATES_API_KEY}"
    )

    results = legislators.json()

    reps = []

    for person in results["results"][:5]:

        reps.append({
            "name": person["name"],
            "party": person.get("party", [{}])[0].get("name",""),
            "image": person.get("image",""),
            "links": person.get("links",[{}])[0].get("url","")
        })

    return {

        "zip": zipcode,
        "city": city,
        "state": state,
        "representatives": reps

    }
