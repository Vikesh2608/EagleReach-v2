
// 🔗 BACKEND URL
const API = "https://eaglereach-v2.onrender.com";


// 🔍 SEARCH BY ZIP
async function searchZip() {

    let zip = document.getElementById("zip").value;

    if (!zip) {
        alert("Enter ZIP code");
        return;
    }

    try {
        // 📍 Get city + state
        let geo = await fetch(`https://api.zippopotam.us/us/${zip}`);
        let geoData = await geo.json();

        let city = geoData.places[0]["place name"];
        let state = geoData.places[0]["state abbreviation"];

        document.getElementById("location").innerHTML =
            `<h3>📍 ${city}, ${state} (${zip})</h3>`;

        console.log("LOCATION:", city, state);

        // 🚀 LOAD ALL DATA
        loadLeaders(zip);
        loadLocalNews(city + " " + state);   // ✅ FIXED
        loadWorldNews();
        loadWeather();

    } catch (err) {
        console.error(err);
        alert("Invalid ZIP or error fetching location");
    }
}


// 📍 USE MY LOCATION
function useLocation() {

    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {

        let lat = pos.coords.latitude;
        let lon = pos.coords.longitude;

        try {
            let geo = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}`
            );

            let data = await geo.json();

            let zip = data.postcode;
            let city = data.city;
            let state = data.principalSubdivision;

            if (!zip) {
                alert("Could not detect ZIP");
                return;
            }

            document.getElementById("zip").value = zip;

            document.getElementById("location").innerHTML =
                `<h3>📍 ${city}, ${state} (${zip})</h3>`;

            console.log("LOCATION:", city, state);

            // 🚀 LOAD ALL DATA
            loadLeaders(zip);
            loadLocalNews(city + " " + state);   // ✅ FIXED
            loadWorldNews();
            loadWeather();

        } catch (err) {
            console.error(err);
            alert("Location fetch failed");
        }

    }, () => {
        alert("Location permission denied");
    });
}


// 🏛 REPRESENTATIVES
async function loadLeaders(zip) {

    try {
        let res = await fetch(`${API}/api/civic?zip=${zip}`);
        let data = await res.json();

        console.log("LEADERS:", data);

        let html = "";

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
        console.error(err);
        document.getElementById("leaders").innerHTML =
            "<div class='card'>Error loading representatives</div>";
    }
}


// 🌤 WEATHER (WITH DAY NAMES)
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

    } catch (err) {
        console.error(err);
        document.getElementById("weather").innerHTML =
            "<div class='card'>Weather unavailable</div>";
    }
}


// 📰 LOCAL NEWS (GOOGLE NEWS — FIXED)
async function loadLocalNews(location) {

    try {
        let res = await fetch(`${API}/api/news/local?city=${location}`);
        let news = await res.json();

        console.log("LOCAL NEWS:", news);

        let html = "";

        if (!news || news.length === 0) {
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
        console.error(err);
        document.getElementById("local").innerHTML =
            "<div class='card'>Error loading local news</div>";
    }
}


// 🌍 WORLD NEWS (GOOGLE NEWS)
async function loadWorldNews() {

    try {
        let res = await fetch(`${API}/api/news/world`);
        let news = await res.json();

        console.log("WORLD NEWS:", news);

        let html = "";

        if (!news || news.length === 0) {
            html = "<div class='card'>No world news available</div>";
        } else {
            news.slice(0,5).forEach(n => {
                html += `
                <div class="card">
                    <a href="${n.link}" target="_blank">${n.title}</a>
                </div>
                `;
            });
        }

        document.getElementById("world").innerHTML = html;

    } catch (err) {
        console.error(err);
        document.getElementById("world").innerHTML =
            "<div class='card'>Error loading world news</div>";
    }
}
