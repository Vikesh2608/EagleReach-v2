const API = "https://eaglereach-v2.onrender.com";

async function searchZip() {

    let zip = document.getElementById("zip").value;

    if (!zip) return alert("Enter ZIP");

    let res = await fetch(`${API}/api/civic?zip=${zip}`);
    let data = await res.json();

    displayLocation(data, zip);
    displayLeaders(data.representatives);
    loadWeather(data.lat, data.lon);
    loadLocalNews(data.city);
    loadWorldNews();
}

function useLocation() {

    navigator.geolocation.getCurrentPosition(async (pos) => {

        let lat = pos.coords.latitude;
        let lon = pos.coords.longitude;

        let res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}`
        );

        let data = await res.json();

        document.getElementById("zip").value = data.postcode;

        searchZip();
    });
}

function displayLocation(data, zip) {

    document.getElementById("location").innerHTML =
        `<h3>📍 ${data.city}, ${data.state}</h3>
         <p>ZIP: ${zip}</p>
         <p>District: ${data.district}</p>`;
}

function displayLeaders(reps) {

    let html = "";

    reps.forEach(r => {
        html += `
        <div class="card">
            <b>${r.name}</b><br>
            ${r.party}<br>
            📞 ${r.phone}<br>
            <a href="${r.link}" target="_blank">Website</a>
        </div>`;
    });

    document.getElementById("leaders").innerHTML = html;
}

async function loadWeather(lat, lon) {

    let res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
    );

    let data = await res.json();

    function icon(code) {
        if (code < 3) return "☀️";
        if (code < 50) return "⛅";
        if (code < 70) return "🌧";
        if (code < 80) return "❄️";
        return "🌩";
    }

    let html = "";

    data.daily.time.forEach((d, i) => {
        html += `
        <div class="card">
            ${icon(data.daily.weathercode[i])} ${d}<br>
            ${data.daily.temperature_2m_max[i]}°C /
            ${data.daily.temperature_2m_min[i]}°C
        </div>`;
    });

    document.getElementById("weather").innerHTML = html;
}

async function loadLocalNews(city) {

    let res = await fetch(`${API}/api/news/local?city=${city}`);
    let news = await res.json();

    let html = "";

    news.slice(0,5).forEach(n => {
        html += `<div class="card">📰 <a href="${n.link}" target="_blank">${n.title}</a></div>`;
    });

    document.getElementById("local").innerHTML = html;
}

async function loadWorldNews() {

    let res = await fetch(`${API}/api/news/world`);
    let news = await res.json();

    let html = "";

    news.slice(0,5).forEach(n => {
        html += `<div class="card">🌍 <a href="${n.link}" target="_blank">${n.title}</a></div>`;
    });

    document.getElementById("world").innerHTML = html;
}
