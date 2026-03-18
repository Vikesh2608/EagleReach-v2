from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import xml.etree.ElementTree as ET

app = FastAPI()

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# 🟢 ROOT
# =========================
@app.get("/")
def home():
    return {"message": "EagleReach API running"}


# =========================
# 🧑‍⚖️ CIVIC (ALL ZIP SUPPORT)
# =========================
@app.get("/api/civic")
def civic(zip: str):

    try:
        geo = requests.get(f"https://api.zippopotam.us/us/{zip}").json()

        place = geo["places"][0]
        city = place["place name"]
        state = place["state abbreviation"]
        lat = float(place["latitude"])
        lon = float(place["longitude"])

        # District lookup
        district = "Unknown"
        try:
            census_url = f"https://geo.fcc.gov/api/census/area?lat={lat}&lon={lon}&format=json"
            census = requests.get(census_url).json()

            if "results" in census and len(census["results"]) > 0:
                districts = census["results"][0].get("districts", [])
                if len(districts) > 0:
                    district = districts[0].get("district", "Unknown")

        except Exception as e:
            print("District error:", e)

        # Representatives (clean fallback)
        reps = [
            {
                "name": f"U.S. Senators ({state})",
                "party": "Federal",
                "phone": "202-224-3121",
                "link": "https://www.senate.gov"
            },
            {
                "name": f"House Representative (District {district})",
                "party": "Federal",
                "phone": "202-225-3121",
                "link": "https://www.house.gov"
            },
            {
                "name": f"{city} Mayor Office",
                "party": "Local",
                "phone": "Check city website",
                "link": "https://www.usa.gov/local-governments"
            }
        ]

        return {
            "zip": zip,
            "city": city,
            "state": state,
            "district": district,
            "lat": lat,
            "lon": lon,
            "representatives": reps
        }

    except:
        return {
            "city": "Unknown",
            "state": "",
            "district": "Unknown",
            "lat": 40.7,
            "lon": -74,
            "representatives": []
        }


# =========================
# 🌍 WORLD NEWS
# =========================
@app.get("/api/news/world")
def world_news():

    try:
        url = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
        res = requests.get(url)
        root = ET.fromstring(res.content)

        news = []
        for item in root.findall(".//item")[:10]:
            news.append({
                "title": item.find("title").text,
                "link": item.find("link").text
            })

        return news

    except:
        return []


# =========================
# 📰 LOCAL NEWS
# =========================
@app.get("/api/news/local")
def local_news(city: str):

    try:
        url = f"https://news.google.com/rss/search?q={city}&hl=en-US&gl=US&ceid=US:en"
        res = requests.get(url)
        root = ET.fromstring(res.content)

        news = []
        for item in root.findall(".//item")[:10]:
            news.append({
                "title": item.find("title").text,
                "link": item.find("link").text
            })

        return news

    except:
        return []
