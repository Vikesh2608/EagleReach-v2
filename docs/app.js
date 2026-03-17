const API = "https://eaglereach-v2.onrender.com";


// 🔍 SEARCH BY ZIP
async function searchZip() {

    let zip = document.getElementById("zip").value;

    if (!zip) {
        alert("Enter ZIP code");
        return;
    }

    try {
        let res = await fetch(`${API}/api/civic?zip=${zip}`);
        let data = await res.json();

        console.log("CIVIC DATA:", data);

        let html = "";

        // ⚠️ HANDLE EMPTY OR FAILED DATA
        if (!data.representatives || data.representatives.length === 0) {

            html = `
            <div class="card">
                <p>⚠️ No representatives found for this ZIP.</p>
                <p>Try another ZIP or use "Use My Location".</p>
            </div>
            `;

        } else {

            // 🏛 RENDER REPRESENTATIVES
            data.representatives.forEach(rep => {

                html += `
                <div class="card">
                    <h3>${rep.name}</h3>
                    <p>${rep.party}</p>
                    <p>📞 ${rep.phone}</p>
                    <a href="${rep.link}" target="_blank">🔗 Website</a>

                    <br><br>

                    <button onclick="generateEmail('${rep.name}')">
                        ✉ Generate Email
                    </button>
                </div>
                `;
            });
        }

        document.getElementById("leaders").innerHTML = html;

        // 🌍 Load world news after search
        loadWorldNews();

        // 📍 Try local news if city exists
        if (window.currentCity) {
            loadLocalNews(window.currentCity);
        }

    } catch (err) {
        console.error(err);
        alert("Error fetching data");
    }
}


// 📍 USE MY LOCATION
async function useLocation() {

    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {

        let lat = pos.coords.latitude;
        let lon = pos.coords.longitude;

        console.log("LOCATION:", lat, lon);

        try {
            let geoRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            );

            let geoData = await geoRes.json();

            console.log("GEO DATA:", geoData);

            let zip = geoData.postcode;
            let city = geoData.city;

            if (!zip) {
                alert("Could not detect ZIP");
                return;
            }

            // Save city globally for local news
            window.currentCity = city;

            document.getElementById("zip").value = zip;

            searchZip();

        } catch (err) {
            console.error(err);
            alert("Location fetch failed");
        }

    }, () => {
        alert("Location permission denied");
    });
}


// 🌍 LOAD WORLD NEWS
async function loadWorldNews() {

    try {
        let res = await fetch(`${API}/api/news/world`);
        let news = await res.json();

        let html = "";

        news.slice(0, 5).forEach(n => {
            html += `
            <div class="card">
                <a href="${n.link}" target="_blank">${n.title}</a>
            </div>
            `;
        });

        document.getElementById("world").innerHTML = html;

    } catch (err) {
        console.error(err);
    }
}


// 📰 LOAD LOCAL NEWS
async function loadLocalNews(city) {

    if (!city) return;

    try {
        let res = await fetch(`${API}/api/news/local?city=${city}`);
        let news = await res.json();

        let html = "";

        news.slice(0, 5).forEach(n => {
            html += `
            <div class="card">
                <a href="${n.link}" target="_blank">${n.title}</a>
            </div>
            `;
        });

        document.getElementById("local").innerHTML = html;

    } catch (err) {
        console.error(err);
    }
}


// 🔄 TAB SWITCHING
function showTab(tab) {

    document.getElementById("leaders").style.display = "none";
    document.getElementById("local").style.display = "none";
    document.getElementById("world").style.display = "none";

    document.getElementById(tab).style.display = "block";
}


// ✉ GENERATE EMAIL (USP FEATURE)
function generateEmail(name) {

    let subject = encodeURIComponent("Concern from a constituent");

    let body = encodeURIComponent(
`Dear ${name},

I am a resident in your constituency and would like to raise a concern regarding:

[Write your issue here]

I appreciate your time and look forward to your response.

Sincerely,
A concerned citizen`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}
