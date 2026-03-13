from fastapi import FastAPI
import requests
import feedparser

app = FastAPI()

@app.get("/")
def home():
    return {"message": "EagleReach API Running"}

@app.get("/api/civic")
def civic(zip: str):

    url = f"https://whoismyrepresentative.com/getall_mems.php?zip={zip}&output=json"

    try:
        r = requests.get(url)
        return r.json()
    except:
        return {"error": "Unable to fetch civic data"}

@app.get("/api/weather")
def weather():

    lat = 40.7128
    lon = -74.0060

    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto"

    r = requests.get(url)

    return r.json()

@app.get("/api/news/world")
def news():

    url = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"

    feed = feedparser.parse(url)

    articles = []

    for entry in feed.entries[:10]:
        articles.append({
            "title": entry.title,
            "link": entry.link
        })

    return articles
