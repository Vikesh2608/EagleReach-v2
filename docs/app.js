// 📰 LOCAL NEWS
async function loadLocalNews(location) {

    try {
        let res = await fetch(`${API}/api/news/local?city=${location}`);
        let news = await res.json();

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


// 🌍 WORLD NEWS
async function loadWorldNews() {

    try {
        let res = await fetch(`${API}/api/news/world`);
        let news = await res.json();

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
