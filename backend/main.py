from fastapi import FastAPI
import requests
import feedparser

app = FastAPI()


@app.get("/")
def home():
    return {"message": "EagleReach API Running"}


# 🏛 Civic Data
@app.get("/api/civic")
def civic(zip: str):

    url = f"https://whoismyrepresentative.com/getall_mems.php?zip={zip}&output=json"

    try:
        r = requests.get(url)
        data = r.json()

        reps = data.get("results", [])

        return {
            "representatives": reps,
            "mayor": "Coming Soon",
            "governor": "Coming Soon"
        }

    except:
        return {"error": "Unable to fetch civic data"}


# 🌦 Weather (optional for now)
@app.get("/api/weather")
def weather():

    url = (
        "https://api.open-meteo.com/v1/forecast"
        "?latitude=40.7128"
        "&longitude=-74.0060"
        "&daily=temperature_2m_max,temperature_2m_min"
        "&timezone=auto"
    )

    r = requests.get(url)

    return r.json()


# 📰 World News (Google RSS)
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
