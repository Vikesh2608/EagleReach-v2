import requests

def get_weather(zip):

    # Temporary example coordinates
    lat = 40.7128
    lon = -74.0060

    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto"

    r = requests.get(url)

    return r.json()
