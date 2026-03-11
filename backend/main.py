from fastapi import FastAPI
import requests

app = FastAPI()

# Google Civic API Key

GOOGLE_API_KEY = "AIzaSyBl0fzmbj2TB-i7ZWMI2ePtt8rTHR-LChM"

@app.get("/")
def home():
return {"message": "EagleReach API is running"}

@app.get("/zip/{zipcode}")
def get_zip_info(zipcode: str):

```
# Step 1: Get ZIP location information  
zip_url = f"https://api.zippopotam.us/us/{zipcode}"  
zip_response = requests.get(zip_url)  

if zip_response.status_code != 200:  
    return {"error": "ZIP code not found"}  

zip_data = zip_response.json()  

city = zip_data["places"][0]["place name"]  
state = zip_data["places"][0]["state abbreviation"]  
latitude = zip_data["places"][0]["latitude"]  
longitude = zip_data["places"][0]["longitude"]  


# Step 2: Get representatives from Google Civic API  
civic_url = f"https://www.googleapis.com/civicinfo/v2/representatives?address={zipcode}&key={GOOGLE_API_KEY}"  
civic_data = requests.get(civic_url).json()  

senators = []  
representatives = []  


if "offices" in civic_data:  

    for office in civic_data["offices"]:  

        # US Senators  
        if "United States Senate" in office["name"]:  

            for index in office["officialIndices"]:  

                official = civic_data["officials"][index]  

                senators.append({  
                    "name": official.get("name"),  
                    "party": official.get("party"),  
                    "phone": official.get("phones", ["N/A"])[0],  
                    "website": official.get("urls", [""])[0]  
                })  


        # US Representatives  
        if "United States House" in office["name"]:  

            for index in office["officialIndices"]:  

                official = civic_data["officials"][index]  

                representatives.append({  
                    "name": official.get("name"),  
                    "party": official.get("party"),  
                    "phone": official.get("phones", ["N/A"])[0],  
                    "website": official.get("urls", [""])[0]  
                })  


return {  
    "zip": zipcode,  
    "city": city,  
    "state": state,  
    "latitude": latitude,  
    "longitude": longitude,  
    "senators": senators,  
    "representatives": representatives  
}  
```
