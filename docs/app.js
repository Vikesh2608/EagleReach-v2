async function searchZip() {

    let zip = document.getElementById("zip").value;

    let response = await fetch(
        "https://eaglereach-v2.onrender.com/api/civic?zip=" + zip
    );

    let data = await response.json();

    let html = "";

    // Governor
    html += `<h3>Governor</h3><p>${data.governor}</p>`;

    // Mayor
    html += `<h3>Mayor</h3><p>${data.mayor}</p>`;

    // Representatives
    html += `<h3>Federal Leaders</h3>`;

    data.representatives.forEach(rep => {
        html += `
            <div style="border:1px solid #ccc; padding:10px; margin:10px;">
                <b>${rep.name}</b><br>
                Party: ${rep.party}<br>
                Phone: ${rep.phone}<br>
                <a href="${rep.link}" target="_blank">Website</a>
            </div>
        `;
    });

    document.getElementById("leaders").innerHTML = html;

    loadNews();
}
