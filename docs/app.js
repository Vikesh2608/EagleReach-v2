function displayLocation(data, zip) {

    document.getElementById("location").innerHTML =
        `
        <h3>📍 ${data.city}, ${data.state}</h3>
        <p>ZIP: ${zip}</p>
        <p>District: ${data.district}</p>
        `;
}
