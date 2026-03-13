import requests

def get_civic_data(zip):

    url = f"https://whoismyrepresentative.com/getall_mems.php?zip={zip}&output=json"

    r = requests.get(url)

    try:
        data = r.json()
    except:
        return {"error": "Unable to fetch civic data"}

    return data
