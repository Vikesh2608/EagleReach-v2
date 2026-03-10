from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CIVIC_DATA = {

"KY":{

"senators":[
{
"name":"Mitch McConnell",
"party":"Republican",
"phone":"202-224-2541",
"website":"https://www.mcconnell.senate.gov"
},
{
"name":"Rand Paul",
"party":"Republican",
"phone":"202-224-4343",
"website":"https://www.paul.senate.gov"
}
],

"representatives":[
{
"name":"Brett Guthrie",
"party":"Republican",
"phone":"202-225-3501",
"website":"https://guthrie.house.gov"
}
]

}

}

@app.get("/")
def root():
    return {"message":"EagleReach API running"}

@app.get("/zip/{zipcode}")
def lookup(zipcode:str):

    geo=requests.get(f"https://api.zippopotam.us/us/{zipcode}")

    if geo.status_code!=200:
        return {"error":"ZIP not found"}

    data=geo.json()

    city=data["places"][0]["place name"]
    state=data["places"][0]["state abbreviation"]
    latitude=data["places"][0]["latitude"]
    longitude=data["places"][0]["longitude"]

    civic=CIVIC_DATA.get(state,{"senators":[],"representatives":[]})

    return{

    "zip":zipcode,
    "city":city,
    "state":state,
    "latitude":latitude,
    "longitude":longitude,
    "senators":civic["senators"],
    "representatives":civic["representatives"]

    }
