from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import datetime

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# CONFIGURATION
# -------------------------

SUPABASE_URL = "https://eadoiuncunctvuljzkqw.supabase.co"
SUPABASE_KEY = "sb_publishable_YHZ9mdJAtir-WkUvJABJVg_mYqCNwBX"

NEWS_API_KEY = "fb053cf22f204148b674c7fe82e5f456"

# -------------------------
# SAMPLE ZIP DATA
# -------------------------

ZIP_DATA = {
    "45220": {"city": "Cincinnati", "state": "OH", "lat": 39.15, "lon": -84.51},
    "41042": {"city": "Florence", "state": "KY", "lat": 38.99, "lon": -84.64}
}

# -------------------------
# CIVIC ISSUES
# -------------------------

ISSUES = [
    "school_funding",
    "road_construction",
    "local_taxes",
    "minimum_wage",
    "healthcare_access"
]

# -------------------------
# ZIP LOOKUP
# -------------------------

@app.get("/zip/{zip}")
def zip_lookup(zip):

    data = ZIP_DATA.get(zip)

    if not data:
        return {"error": "ZIP not found"}

    return {
        "zip": zip,
        "city": data["city"],
        "state": data["state"],
        "latitude": data["lat"],
        "longitude": data["lon"]
    }

# -------------------------
# GET ISSUES
# -------------------------

@app.get("/issues")
def get_issues():
    return ISSUES

# -------------------------
# VOTE ENDPOINT (GET)
# -------------------------

@app.get("/vote/{zip}/{issue}/{vote}")
def vote(zip, issue, vote):

    payload = {
        "zip": zip,
        "issue": issue,
        "vote": vote
    }

    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/votes",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        json=payload
    )

    return {
        "status": "vote recorded",
        "zip": zip,
        "issue": issue,
        "vote": vote
    }

# -------------------------
# VOTE RESULTS
# -------------------------

@app.get("/votes/{zip}")
def results(zip):

    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/votes?zip=eq.{zip}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
    )

    data = r.json()

    result = {}

    for issue in ISSUES:

        support = len([v for v in data if v["issue"] == issue and v["vote"] == "support"])
        oppose = len([v for v in data if v["issue"] == issue and v["vote"] == "oppose"])

        result[issue] = {
            "support": support,
            "oppose": oppose
        }

    return result

# -------------------------
# WEATHER FORECAST
# -------------------------

@app.get("/weather/{lat}/{lon}")
def weather(lat, lon):

    r = requests.get(
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,precipitation_sum&timezone=auto"
    )

    data = r.json()

    days = []

    for i in range(5):
        days.append({
            "date": data["daily"]["time"][i],
            "max_temp": data["daily"]["temperature_2m_max"][i],
            "rain": data["daily"]["precipitation_sum"][i]
        })

    return days

# -------------------------
# WORLD NEWS
# -------------------------

@app.get("/news/world")
def world_news():

    r = requests.get(
        f"https://newsapi.org/v2/top-headlines?language=en&apiKey={NEWS_API_KEY}"
    )

    articles = r.json().get("articles", [])

    return articles[:10]

# -------------------------
# LOCAL NEWS
# -------------------------

@app.get("/news/local/{city}")
def local_news(city):

    r = requests.get(
        f"https://newsapi.org/v2/everything?q={city}&apiKey={NEWS_API_KEY}"
    )

    articles = r.json().get("articles", [])

    return articles[:10]

# -------------------------
# EMERGENCY NUMBERS
# -------------------------

@app.get("/emergency")
def emergency():

    return {
        "Police": "911",
        "Medical": "911",
        "Fire": "911",
        "Suicide Hotline": "988"
    }

# -------------------------
# CURRENT TIME
# -------------------------

@app.get("/time")
def time():

    return {
        "time": str(datetime.datetime.now())
    }
