from fastapi import FastAPI
import requests
import feedparser

app = FastAPI()


@app.get("/")
def home():
    return {"message": "EagleReach API Running"}


# CIVIC REPRESENTATIVES
@app.get("/api/civic")
def civic(zip: str):

    url = f"https://whoismyrepresentative.com/getall_mems.php?zip={zip}&output=json"

    try:
        r = requests.get(url)
        data = r.json()

        leaders = {
            "representatives": data.get("results", []),
            "governor": None,
            "mayor": None
        }

        # Example placeholders until we add full dataset
        leaders["governor"] = "Governor information coming soon"
        leaders["mayor"] = "Mayor lookup coming soon"

        return leaders

    except:
        return {"error": "Unable to fetch civic data"}


# WEATHER
@app.get("/api/weather")
def weather():

    lat = 40.7128
    lon = -74.0060

    url = (
        "https://api.open-meteo.com/v1/forecast"
        "?latitude=40.7128"
        "&longitude=-74.0060"
        "&daily=weathercode,temperature_2m_max,temperature_2m_min"
        "&timezone=auto"
    )

    r = requests.get(url)

    return r.json()


# WORLD NEWS
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
