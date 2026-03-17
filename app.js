async function searchZip() {

    let zip = document.getElementById("zip").value;

    let response = await fetch(
        "https://eaglereach-v2.onrender.com/api/civic?zip=" + zip
    );

    let data = await response.json();

    let html = "";

    data.results.forEach(rep => {
        html += `<p><b>${rep.name}</b> (${rep.party})</p>`;
    });

    document.getElementById("leaders").innerHTML = html;
}
