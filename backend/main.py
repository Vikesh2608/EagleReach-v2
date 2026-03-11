from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
from datetime import datetime

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your News API Key
NEWS_API_KEY = "fb053cf22f204148b674c7fe82e5f456"


# ------------------------------
# ZIP → CITY / STATE
# ------------------------------
@app.get("/zip/{zip_code}")
def zip_lookup(zip_code: str):

    geo = requests.get(f"https://api.zippopotam.us/us/{zip_code}")

    if geo.status_code != 200:
        return {"error": "ZIP code not found"}

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


# ------------------------------
# US REPRESENTATIVES
# ------------------------------
@app.get("/representatives")
def representatives():

    url = "https://www.govtrack.us/api/v2/role?current=true&role_type=representative"

    r = requests.get(url)

    data = r.json()

    reps = []

    for m in data["objects"][:15]:

        reps.append({
            "name": m["person"]["name"],
            "party": m["party"],
            "state": m["state"],
            "website": m["person"]["link"]
        })

    return reps


# ------------------------------
# US SENATORS
# ------------------------------
@app.get("/senators")
def senators():

    url = "https://www.govtrack.us/api/v2/role?current=true&role_type=senator"

    r = requests.get(url)

    data = r.json()

    senators = []

    for m in data["objects"]:

        senators.append({
            "name": m["person"]["name"],
            "party": m["party"],
            "state": m["state"],
            "website": m["person"]["link"]
        })

    return senators


# ------------------------------
# LOCAL NEWS
# ------------------------------
@app.get("/news/local/{city}")
def local_news(city: str):

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


# ------------------------------
# WORLD NEWS
# ------------------------------
@app.get("/news/world")
def world_news():

    url = f"https://newsapi.org/v2/top-headlines?country=us&apiKey={NEWS_API_KEY}"

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


# ------------------------------
# WEATHER FORECAST
# ------------------------------
@app.get("/weather/{lat}/{lon}")
def weather(lat: str, lon: str):

    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto"

    r = requests.get(url)

    data = r.json()

    forecast = []

    days = data["daily"]["time"]

    for i in range(len(days)):

        forecast.append({
            "date": days[i],
            "max_temp": data["daily"]["temperature_2m_max"][i],
            "min_temp": data["daily"]["temperature_2m_min"][i],
            "rain": data["daily"]["precipitation_sum"][i]
        })

    return forecast


# ------------------------------
# CURRENT TIME
# ------------------------------
@app.get("/time")
def current_time():

    return {
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


# ------------------------------
# EMERGENCY NUMBERS
# ------------------------------
@app.get("/emergency")
def emergency():

    return {
        "Police": "911",
        "Fire": "911",
        "Medical": "911",
        "Suicide Hotline": "988",
        "Community Help": "211",
        "Disaster Assistance": "1-800-621-3362"
    }
