const API = "https://eaglereach-v2.onrender.com";

// 🔍 Search by ZIP
async function searchZip() {

    let zip = document.getElementById("zip").value;

    if (!zip) {
        alert("Enter ZIP code");
        return;
    }

    try {
        let res = await fetch(`${API}/api/civic?zip=${zip}`);
        let data = await res.json();

        console.log("CIVIC:", data);

        let html = "";

        if (!data.representatives) {
            html = "<p>No data found</p>";
        } else {
            data.representatives.forEach(rep => {
                html += `
                <div class="card">
                    <h3>${rep.name}</h3>
                    <p>${rep.party}</p>
                    <p>📞 ${rep.phone}</p>
                    <a href="${rep.link}" target="_blank">🔗 Website</a>
                </div>
                `;
            });
        }

        document.getElementById("leaders").innerHTML = html;

        loadNews();

    } catch (err) {
        console.error(err);
        alert("Error fetching data");
    }
}


// 📍 Use My Location
async function useLocation() {

    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {

        let lat = pos.coords.latitude;
        let lon = pos.coords.longitude;

        let geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );

        let geoData = await geoRes.json();

        let zip = geoData.postcode;

        if (!zip) {
            alert("Could not detect ZIP");
            return;
        }

        document.getElementById("zip").value = zip;

        searchZip();

    }, () => {
        alert("Permission denied");
    });
}


// 🌍 Load World News
async function loadNews() {

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

    document.getElementById("news").innerHTML = html;
}
