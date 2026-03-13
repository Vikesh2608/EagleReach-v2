from .fastapi import FastAPI
from .civic import get_civic_data
from .weather import get_weather
from .news import get_world_news

app = FastAPI()

@app.get("/")
def home():
    return {"message": "EagleReach API Running"}

@app.get("/api/civic")
def civic(zip: str):
    return get_civic_data(zip)

@app.get("/api/weather")
def weather(zip: str):
    return get_weather(zip)

@app.get("/api/news/world")
def world_news():
    return get_world_news()
