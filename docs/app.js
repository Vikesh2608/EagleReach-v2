const API = "https://eaglereach-v2.onrender.com";

async function searchZip() {

    let zip = document.getElementById("zip").value;

    if (!zip) {
        alert("Enter ZIP");
        return;
    }

    loadLeaders(zip);
    loadNews(zip);
    loadWorldNews();
    loadWeather();
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


async function loadLeaders(zip) {

    let res = await fetch(`${API}/api/civic?zip=${zip}`);
    let data = await res.json();

    let city = data.city || "Unknown";
    let state = data.state || "";
    let district = data.district || "N/A";

    document.getElementById("location").innerHTML =
        `<h3>📍 ${city}, ${state} (${zip})</h3>
         <p>District: ${district}</p>`;

    let html = "";

    if (!data.representatives.length) {
        html = "<div class='card'>No representatives found</div>";
    } else {

        data.representatives.forEach(rep => {
            html += `
            <div class="card">
                <b>${rep.name}</b><br>
                ${rep.party}<br>
                📞 ${rep.phone}<br>
                <a href="${rep.link}" target="_blank">Website</a>
            </div>
            `;
        });
    }

    document.getElementById("leaders").innerHTML = html;
}


async function loadNews(zip) {

    let civic = await fetch(`${API}/api/civic?zip=${zip}`);
    let data = await civic.json();

    let city = data.city || "";

    let res = await fetch(`${API}/api/news/local?city=${city}`);
    let news = await res.json();

    let html = "";

    news.slice(0,5).forEach(n => {
        html += `<div class="card"><a href="${n.link}" target="_blank">${n.title}</a></div>`;
    });

    document.getElementById("local").innerHTML = html;
}


async function loadWorldNews() {

    let res = await fetch(`${API}/api/news/world`);
    let news = await res.json();

    let html = "";

    news.slice(0,5).forEach(n => {
        html += `<div class="card"><a href="${n.link}" target="_blank">${n.title}</a></div>`;
    });

    document.getElementById("world").innerHTML = html;
}


async function loadWeather() {

    let res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=40.7&longitude=-74&daily=temperature_2m_max,temperature_2m_min&timezone=auto"
    );

    let data = await res.json();

    let html = "";

    data.daily.time.forEach((d, i) => {
        html += `
        <div class="card">
            ${d}<br>
            ${data.daily.temperature_2m_max[i]}°C /
            ${data.daily.temperature_2m_min[i]}°C
        </div>`;
    });

    document.getElementById("weather").innerHTML = html;
}
