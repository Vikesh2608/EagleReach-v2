from fastapi import FastAPI
import httpx

app = FastAPI()

ZIP_API = "https://api.zippopotam.us/us/{zip}"

@app.get("/")
def home():
    return {"message": "EagleReach API running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/zip/{zip_code}")
async def get_zip(zip_code: str):

    async with httpx.AsyncClient() as client:
        response = await client.get(ZIP_API.format(zip=zip_code))

    if response.status_code != 200:
        return {"error": "ZIP not found"}

    data = response.json()

    place = data["places"][0]

    return {
        "zip": zip_code,
        "city": place["place name"],
        "state": place["state"],
        "latitude": place["latitude"],
        "longitude": place["longitude"]
    }
