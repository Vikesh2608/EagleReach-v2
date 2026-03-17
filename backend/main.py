from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import feedparser

app = FastAPI()

# ✅ FIX CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "EagleReach API Running"}


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

    except Exception as e:
        return {"error": str(e)}


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
