const API_BASE = "https://eaglereach-v2.onrender.com";


// 🚀 MAIN SEARCH FUNCTION
async function searchZip() {
    const zip = document.getElementById("zipInput").value;

    if (!zip) {
        alert("Enter ZIP code");
        return;
    }

    try {
        // 📍 Location info
        const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`);
        const geoData = await geoRes.json();

        const city = geoData.places[0]["place name"];
        const state = geoData.places[0]["state abbreviation"];

        document.getElementById("location").innerHTML =
            `📍 ${city}, ${state} (${zip})`;

        // 👇 Load everything
        loadRepresentatives(zip);
        loadWeather(city);
        loadLocalNews(city);
        loadWorldNews();

    } catch (err) {
        alert("Invalid ZIP code");
    }
}


// 🧑‍⚖️ REPRESENTATIVES
async function loadRepresentatives(zip) {
    const container = document.getElementById("representatives");
    container.innerHTML = "Loading...";

    try {
        const res = await fetch(`${API_BASE}/api/civic?zip=${zip}`);
        const data = await res.json();

        if (!data.representatives) {
            container.innerHTML = "No data found";
            return;
        }

        container.innerHTML = "";

        data.representatives.forEach(rep => {
            container.innerHTML += `
                <div class="card">
                    <h3>${rep.name}</h3>
                    <p>${rep.party || ""}</p>
                    <p>📞 ${rep.phone || "N/A"}</p>
                    <a href="${rep.link}" target="_blank">Website</a>
                </div>
            `;
        });

    } catch (err) {
        container.innerHTML = "Error loading representatives";
    }
}


// 🌦 WEATHER (Open-Meteo)
async function loadWeather(city) {
    const container = document.getElementById("weather");

    try {
        const geo = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}`
        );
        const geoData = await geo.json();

        const lat = geoData.results[0].latitude;
        const lon = geoData.results[0].longitude;

        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
        );

        const weatherData = await weatherRes.json();

        const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

        container.innerHTML = "";

        weatherData.daily.time.forEach((date, i) => {
            const dayName = days[new Date(date).getDay()];

            container.innerHTML += `
                <div class="card">
                    <b>${dayName}</b><br>
                    🌡 ${weatherData.daily.temperature_2m_max[i]}°C /
                    ${weatherData.daily.temperature_2m_min[i]}°C
                </div>
            `;
        });

    } catch (err) {
        container.innerHTML = "Weather unavailable";
    }
}


// 📰 LOCAL NEWS (FIXED)
async function loadLocalNews(city) {
    const container = document.getElementById("localNews");
    container.innerHTML = "Loading...";

    try {
        const res = await fetch(
            `${API_BASE}/api/news/local?city=${encodeURIComponent(city)}`
        );

        const data = await res.json();

        container.innerHTML = "";

        data.forEach(article => {
            container.innerHTML += `
                <div class="card">
                    <a href="${article.link}" target="_blank">
                        ${article.title}
                    </a>
                </div>
            `;
        });

    } catch (err) {
        container.innerHTML = "Error loading local news";
    }
}


// 🌍 WORLD NEWS (FIXED)
async function loadWorldNews() {
    const container = document.getElementById("worldNews");
    container.innerHTML = "Loading...";

    try {
        const res = await fetch(`${API_BASE}/api/news/world`);
        const data = await res.json();

        container.innerHTML = "";

        data.forEach(article => {
            container.innerHTML += `
                <div class="card">
                    <a href="${article.link}" target="_blank">
                        ${article.title}
                    </a>
                </div>
            `;
        });

    } catch (err) {
        container.innerHTML = "Error loading world news";
    }
}


// 📍 USE MY LOCATION
function useMyLocation() {
    navigator.geolocation.getCurrentPosition(async position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );

        const data = await res.json();

        const zip = data.postcode;

        document.getElementById("zipInput").value = zip;

        searchZip();

    }, () => {
        alert("Location access denied");
    });
}
