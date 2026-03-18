import requests
import xml.etree.ElementTree as ET
from fastapi import FastAPI

app = FastAPI()


# 🌍 WORLD NEWS
@app.get("/api/news/world")
def world_news():

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


# 📰 LOCAL NEWS (IMPORTANT)
@app.get("/api/news/local")
def local_news(city: str):

    # 🔥 This is key — search query
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
