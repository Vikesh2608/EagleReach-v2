from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
from officials_data import OFFICIALS
from supabase import create_client

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = "YOUR_SUPABASE_URL"
SUPABASE_KEY = "YOUR_SUPABASE_KEY"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

NEWS_API = "YOUR_NEWS_API_KEY"


@app.get("/")
def root():
    return {"message":"EagleReach API running"}


@app.get("/officials/{zip}")
def officials(zip):

    data = OFFICIALS.get(zip)

    if not data:
        return {"error":"ZIP not supported yet"}

    return data


@app.get("/weather/{city}")
def weather(city):

    geo = requests.get(
        f"https://geocoding-api.open-meteo.com/v1/search?name={city}"
    ).json()

    lat = geo["results"][0]["latitude"]
    lon = geo["results"][0]["longitude"]

    weather = requests.get(
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
    ).json()

    return weather["current_weather"]


@app.get("/news/world")
def world_news():

    r = requests.get(
        f"https://newsapi.org/v2/top-headlines?language=en&pageSize=10&apiKey={NEWS_API}"
    )

    return r.json()["articles"]


@app.get("/news/local/{city}")
def local_news(city):

    r = requests.get(
        f"https://newsapi.org/v2/everything?q={city}&pageSize=10&apiKey={NEWS_API}"
    )

    return r.json()["articles"]


@app.get("/issues")
def issues():

    return [
        "school_funding",
        "road_construction",
        "local_taxes",
        "minimum_wage",
        "healthcare_access"
    ]


@app.post("/vote/{zip}/{issue}/{vote}")
def vote(zip,issue,vote):

    supabase.table("votes").insert({
        "zip":zip,
        "issue":issue,
        "vote":vote
    }).execute()

    return {"message":"vote recorded"}
