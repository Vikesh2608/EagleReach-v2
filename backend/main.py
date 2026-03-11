from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

NEWS_API_KEY = "PASTE_NEWSAPI_KEY"


# ------------------------
# ZIP lookup
# ------------------------
@app.get("/zip/{zip_code}")
def zip_lookup(zip_code: str):

    geo = requests.get(f"https://api.zippopotam.us/us/{zip_code}")

    if geo.status_code != 200:
        return {"error": "ZIP not found"}

    data = geo.json()

    city = data["places"][0]["place name"]
    state = data["places"][0]["state abbreviation"]
    lat = data["places"][0]["latitude"]
    lon = data["places"][0]["longitude"]

    return {
        "zip": zip_code,
        "city": city,
        "state": state,
        "latitude": lat,
        "longitude": lon
    }


# ------------------------
# US Congress
# ------------------------
@app.get("/representatives")
def representatives():

    url = "https://www.govtrack.us/api/v2/role?current=true&role_type=representative"

    r = requests.get(url)

    data = r.json()

    reps = []

    for m in data["objects"][:10]:

        reps.append({
            "name": m["person"]["name"],
            "party": m["party"],
            "website": m["person"]["link"]
        })

    return reps


# ------------------------
# Senators
# ------------------------
@app.get("/senators")
def senators():

    url = "https://www.govtrack.us/api/v2/role?current=true&role_type=senator"

    r = requests.get(url)

    data = r.json()

    s = []

    for m in data["objects"][:10]:

        s.append({
            "name": m["person"]["name"],
            "party": m["party"],
            "website": m["person"]["link"]
        })

    return s


# ------------------------
# News
# ------------------------
@app.get("/news/{city}")
def news(city: str):

    url = f"https://newsapi.org/v2/everything?q={city}&sortBy=publishedAt&apiKey={NEWS_API_KEY}"

    r = requests.get(url)

    data = r.json()

    articles = []

    for a in data["articles"][:6]:

        articles.append({
            "title": a["title"],
            "source": a["source"]["name"],
            "url": a["url"]
        })

    return articles


# ------------------------
# Weather
# ------------------------
@app.get("/weather/{lat}/{lon}")
def weather(lat: str, lon: str):

    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto"

    r = requests.get(url)

    return r.json()


# ------------------------
# Time
# ------------------------
@app.get("/time")
def time():

    return {
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


# ------------------------
# Emergency
# ------------------------
@app.get("/emergency")
def emergency():

    return {
        "Police": "911",
        "Medical": "911",
        "Fire": "911",
        "Suicide Hotline": "988",
        "Community Help": "211"
    }
