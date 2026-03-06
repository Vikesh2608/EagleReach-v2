from fastapi import FastAPI
import httpx
import yaml

app = FastAPI()

LEGISLATORS_URL = "https://raw.githubusercontent.com/unitedstates/congress-legislators/gh-pages/legislators-current.yaml"


async def get_legislators(state_code):

    async with httpx.AsyncClient() as client:
        r = await client.get(LEGISLATORS_URL)
        legislators = yaml.safe_load(r.text)

    senators = []
    representatives = []

    for person in legislators:

        term = person["terms"][-1]

        if term["state"] == state_code:

            name = person["name"]["official_full"]

            if term["type"] == "sen":
                senators.append(name)

            if term["type"] == "rep":
                representatives.append(name)

    return senators, representatives


@app.get("/")
def home():
    return {"message": "EagleReach API running"}


@app.get("/zip/{zip_code}")
async def get_zip(zip_code: str):

    async with httpx.AsyncClient() as client:

        r = await client.get(f"https://api.zippopotam.us/us/{zip_code}")

        if r.status_code != 200:
            return {"error": "ZIP code not found"}

        data = r.json()

        city = data["places"][0]["place name"]
        state = data["places"][0]["state"]
        state_code = data["places"][0]["state abbreviation"]
        latitude = data["places"][0]["latitude"]
        longitude = data["places"][0]["longitude"]

        senators, reps = await get_legislators(state_code)

        return {
            "zip": zip_code,
            "city": city,
            "state": state,
            "latitude": latitude,
            "longitude": longitude,
            "senators": senators[:2],
            "representatives": reps[:1]
        }
