from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import xml.etree.ElementTree as ET

app = FastAPI()

# ✅ CORS (VERY IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🟢 ROOT
@app.get("/")
def home():
    return {"message": "EagleReach API running"}

# ============================
# 🧑‍⚖️ CIVIC API (ALL ZIPS WORK)
# ============================
@app.get("/api/civic")
def get_civic(zip: str):

    try:
        # 📍 STEP 1: ZIP → Location
        geo = requests.get(f"https://api.zippopotam.us/us/{zip}").json()

        place = geo["places"][0]
        city = place["place name"]
        state = place["state abbreviation"]
        lat = place["latitude"]
        lon = place["longitude"]

        # 🏛 STEP 2: Get district (FCC Census)
        census_url = f"https://geo.fcc.gov/api/census/area?lat={lat}&lon={lon}&format=json"
        census = requests.get(census_url).json()

        district = census["results"][0]["districts"][0]["district"]

        # 🧑‍⚖️ STEP 3: Representatives (Hybrid realistic)
        reps = [
            {
                "name": f"{state} U.S. Senator",
                "party": "Federal",
                "phone": "202-224-3121",
                "link": "https://www.senate.gov"
            },
            {
                "name": f"District {district} House Representative",
                "party": "Federal",
                "phone": "202-225-3121",
                "link": "https://www.house.gov"
            },
            {
                "name": f"{city} Mayor",
                "party": "Local",
                "phone": "Visit city website",
                "link": "https://www.usa.gov/local-governments"
            }
        ]

        return {
            "zip": zip,
            "city": city,
            "state": state,
            "district": district,
            "representatives": reps
        }

    except Exception as e:
        return {
            "representatives": [],
            "error": str(e)
        }


# ============================
# 🌍 WORLD NEWS
# ============================
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


# ============================
# 📰 LOCAL NEWS (CITY BASED)
# ============================
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
