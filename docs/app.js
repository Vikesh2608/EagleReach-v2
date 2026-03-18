const API = "https://eaglereach-v2.onrender.com";

// SEARCH
async function searchZip() {

    let zip = document.getElementById("zip").value;

    if (!zip) return;

    // 📍 Get City + State
    let geo = await fetch(`https://api.zippopotam.us/us/${zip}`);
    let geoData = await geo.json();

    let city = geoData.places[0]["place name"];
    let state = geoData.places[0]["state abbreviation"];

    document.getElementById("location").innerHTML =
        `<h3>📍 ${city}, ${state} (${zip})</h3>`;

    loadLeaders(zip);
    loadLocalNews(city);
    loadWorldNews();
    loadWeather(city);
}


// LOCATION
function useLocation() {

    navigator.geolocation.getCurrentPosition(async (pos) => {

        let lat = pos.coords.latitude;
        let lon = pos.coords.longitude;

        let geo = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}`
        );

        let data = await geo.json();

        document.getElementById("zip").value = data.postcode;

        searchZip();
    });
}


// 🏛 LEADERS
async function loadLeaders(zip) {

    let res = await fetch(`${API}/api/civic?zip=${zip}`);
    let data = await res.json();

    let html = "";

    if (!data.representatives || data.representatives.length === 0) {
        html = "<div class='card'>No data found</div>";
    } else {

        data.representatives.forEach(rep => {
            html += `
            <div class="card">
                <h3>${rep.name}</h3>
                <p>${rep.party}</p>
                <p>📞 ${rep.phone}</p>
                <a href="${rep.link}" target="_blank">Website</a>
            </div>
            `;
        });
    }

    document.getElementById("leaders").innerHTML = html;
}


// 🌤 WEATHER
async function loadWeather(city) {

    // Using fixed NYC for now (simple MVP)
    let res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.00&daily=temperature_2m_max,temperature_2m_min&timezone=auto"
    );

    let data = await res.json();

    let html = "";

    data.daily.temperature_2m_max.forEach((t, i) => {
        html += `
        <div class="card">
            Day ${i+1}: ${t}°C / ${data.daily.temperature_2m_min[i]}°C
        </div>
        `;
    });

    document.getElementById("weather").innerHTML = html;
}


// 📰 LOCAL NEWS
async function loadLocalNews(city) {

    let res = await fetch(`${API}/api/news/local?city=${city}`);
    let news = await res.json();

    let html = "";

    news.slice(0,5).forEach(n => {
        html += `
        <div class="card">
            <a href="${n.link}" target="_blank">${n.title}</a>
        </div>
        `;
    });

    document.getElementById("local").innerHTML = html;
}


// 🌍 WORLD NEWS
async function loadWorldNews() {

    let res = await fetch(`${API}/api/news/world`);
    let news = await res.json();

    let html = "";

    news.slice(0,5).forEach(n => {
        html += `
        <div class="card">
            <a href="${n.link}" target="_blank">${n.title}</a>
        </div>
        `;
    });

    document.getElementById("world").innerHTML = html;
}
