from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
from fastapi import HTTPException
import re
import xml.etree.ElementTree as ET

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "EagleReach API running"}

@app.get("/api/civic")
def civic(zip: str):

    if not re.fullmatch(r"\d{5}", zip):
        raise HTTPException(status_code=400, detail="Enter a valid five-digit U.S. ZIP code")

    try:
        geo_response = requests.get(f"https://api.zippopotam.us/us/{zip}", timeout=10)
        if geo_response.status_code == 404:
            raise HTTPException(status_code=404, detail="ZIP code not found")
        geo_response.raise_for_status()
        geo = geo_response.json()

        place = geo["places"][0]
        city = place["place name"]
        state = place["state abbreviation"]
        lat = float(place["latitude"])
        lon = float(place["longitude"])

        district = "Unknown"

        try:
            census = requests.get(
                f"https://geo.fcc.gov/api/census/area?lat={lat}&lon={lon}&format=json", timeout=10
            ).json()

            if census.get("results"):
                d = census["results"][0].get("districts", [])
                if d:
                    district = d[0].get("district", "Unknown")

        except:
            pass

        reps = [
            {
                "name": f"Find U.S. Senators for {state}",
                "party": "Federal",
                "phone": "202-224-3121",
                "link": "https://www.senate.gov"
            },
            {
                "name": f"Find your U.S. House Representative (district estimate: {district})",
                "party": "Federal",
                "phone": "202-225-3121",
                "link": "https://www.house.gov"
            },
            {
                "name": f"Find local government offices in {city}",
                "party": "Local",
                "phone": "Check city website",
                "link": "https://www.usa.gov/local-governments"
            }
        ]

        return {
            "city": city,
            "state": state,
            "district": district,
            "lat": lat,
            "lon": lon,
            "representatives": reps
        }

    except HTTPException:
        raise
    except (requests.RequestException, ValueError, KeyError, IndexError, TypeError):
        raise HTTPException(status_code=503, detail="Location lookup is temporarily unavailable")


@app.get("/api/news/world")
def world_news():
    try:
        url = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
        res = requests.get(url)
        root = ET.fromstring(res.content)

        return [
            {
                "title": item.find("title").text,
                "link": item.find("link").text
            }
            for item in root.findall(".//item")[:10]
        ]
    except:
        return []


@app.get("/api/news/local")
def local_news(city: str):
    try:
        url = f"https://news.google.com/rss/search?q={city}&hl=en-US&gl=US&ceid=US:en"
        res = requests.get(url)
        root = ET.fromstring(res.content)

        return [
            {
                "title": item.find("title").text,
                "link": item.find("link").text
            }
            for item in root.findall(".//item")[:10]
        ]
    except:
        return []
