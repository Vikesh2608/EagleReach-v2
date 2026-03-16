from fastapi import FastAPI
import requests
import feedparser

app = FastAPI()

@app.get("/")
def home():
    return {"message": "EagleReach API Running"}

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
