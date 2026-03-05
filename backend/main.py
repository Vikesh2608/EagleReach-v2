from fastapi import FastAPI
import httpx

app = FastAPI()

ZIP_API = "https://api.zippopotam.us/us/{}"
WEATHER_API = "https://api.open-meteo.com/v1/forecast?latitude={}&longitude={}&current_weather=true"

@app.get("/")
def home():
    return {"message": "EagleReach API running"}

@app.get("/zip/{zip_code}")
async def get_zip_info(zip_code: str):

    async with httpx.AsyncClient() as client:

        # Get ZIP location
        r = await client.get(ZIP_API.format(zip_code))

        if r.status_code != 200:
            return {"error": "ZIP not found"}

        data = r.json()

        city = data["places"][0]["place name"]
        state = data["places"][0]["state"]
        latitude = data["places"][0]["latitude"]
        longitude = data["places"][0]["longitude"]

        # Get weather
        weather_url = WEATHER_API.format(latitude, longitude)
        weather_res = await client.get(weather_url)

        weather = weather_res.json()

        temperature = weather["current_weather"]["temperature"]
        windspeed = weather["current_weather"]["windspeed"]

        return {
            "zip": zip_code,
            "city": city,
            "state": state,
            "latitude": latitude,
            "longitude": longitude,
            "temperature": temperature,
            "windspeed": windspeed
        }
