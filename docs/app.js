const API = "https://eaglereach-v2.onrender.com";


// 🔍 SEARCH
async function searchZip() {

    let zip = document.getElementById("zip").value;

    if (!zip) {
        alert("Enter ZIP code");
        return;
    }

    loadLeaders(zip);
    loadLocalNews(zip);
    loadWorldNews();
    loadWeather();
}


// 📍 USE LOCATION
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


// 🏛 REPRESENTATIVES
async function loadLeaders(zip) {

    try {
        let res = await fetch(`${API}/api/civic?zip=${zip}`);
        let data = await res.json();

        let html = "";

        document.getElementById("location").innerHTML =
            `<h3>📍 ${data.city}, ${data.state} (${zip})</h3>
             <p>🏛 District: ${data.district}</p>`;

        if (!data.representatives || data.representatives.length === 0) {
            html = "<div class='card'>⚠️ No representatives found</div>";
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

    } catch (err) {
        document.getElementById("leaders").innerHTML =
            "<div class='card'>Error loading representatives</div>";
    }
}


// 📰 LOCAL NEWS
async function loadLocalNews(zip) {

    try {
        let civic = await fetch(`${API}/api/civic?zip=${zip}`);
        let civicData = await civic.json();

        let location = civicData.city + " " + civicData.state;

        let res = await fetch(`${API}/api/news/local?city=${location}`);
        let news = await res.json();

        let html = "";

        if (!news.length) {
            html = "<div class='card'>No local news found</div>";
        } else {
            news.slice(0,5).forEach(n => {
                html += `
                <div class="card">
                    <a href="${n.link}" target="_blank">${n.title}</a>
                </div>
                `;
            });
        }

        document.getElementById("local").innerHTML = html;

    } catch (err) {
        document.getElementById("local").innerHTML =
            "<div class='card'>Error loading local news</div>";
    }
}


// 🌍 WORLD NEWS
async function loadWorldNews() {

    try {
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

    } catch {
        document.getElementById("world").innerHTML =
            "<div class='card'>Error loading world news</div>";
    }
}


// 🌤 WEATHER
async function loadWeather() {

    try {
        let res = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.00&daily=temperature_2m_max,temperature_2m_min&timezone=auto"
        );

        let data = await res.json();

        const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

        let html = "";

        data.daily.time.forEach((date, i) => {

            let d = new Date(date);
            let dayName = days[d.getDay()];

            html += `
            <div class="card">
                <b>${dayName}</b><br>
                🌡 ${data.daily.temperature_2m_max[i]}°C /
                ${data.daily.temperature_2m_min[i]}°C
            </div>
            `;
        });

        document.getElementById("weather").innerHTML = html;

    } catch {
        document.getElementById("weather").innerHTML =
            "<div class='card'>Weather unavailable</div>";
    }
}
