const API = "https://eaglereach-v2.onrender.com"


async function searchZip(){

const zip = document.getElementById("zip").value

const officials = await fetch(API+"/officials/"+zip)
const data = await officials.json()

document.getElementById("location").innerHTML =
`<h2>${data.city}, ${data.state}</h2>`


let html = "<h3>Government Officials</h3>"

html += `<p><b>Mayor</b><br>
${data.mayor.name}<br>
<a href="${data.mayor.website}" target="_blank">Website</a></p>`

html += "<p><b>Senators</b></p>"

data.senators.forEach(s=>{
html += `${s.name}<br>
<a href="${s.website}" target="_blank">Website</a><br><br>`
})

html += `<p><b>Representative</b><br>
${data.representative.name}<br>
<a href="${data.representative.website}" target="_blank">Website</a></p>`

document.getElementById("officials").innerHTML = html


loadWeather(data.city)
loadIssues(zip)
loadWorldNews()
loadLocalNews(data.city)

}



function useLocation(){

navigator.geolocation.getCurrentPosition(async pos=>{

const lat = pos.coords.latitude
const lon = pos.coords.longitude

const geo = await fetch(
`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}`
)

const data = await geo.json()

document.getElementById("zip").value = data.postcode

searchZip()

})

}



async function loadWeather(city){

const r = await fetch(API+"/weather/"+city)

const data = await r.json()

document.getElementById("weather").innerHTML =
`<h3>Weather</h3>
Temperature: ${data.temperature}°C
`

}



async function loadWorldNews(){

const r = await fetch(API+"/news/world")

const news = await r.json()

let html = "<h3>World News</h3>"

news.forEach(n=>{
html += `<p><a href="${n.url}" target="_blank">${n.title}</a></p>`
})

document.getElementById("news").innerHTML = html

}



async function loadLocalNews(city){

const r = await fetch(API+"/news/local/"+city)

const news = await r.json()

let html = "<h3>Local News</h3>"

news.forEach(n=>{
html += `<p><a href="${n.url}" target="_blank">${n.title}</a></p>`
})

document.getElementById("news").innerHTML += html

}



async function loadIssues(zip){

const r = await fetch(API+"/issues")
const issues = await r.json()

let html = "<h3>Community Pulse</h3>"

issues.forEach(issue=>{

html += `
<p>${issue}</p>
<button onclick="vote('${zip}','${issue}','support')">Support</button>
<button onclick="vote('${zip}','${issue}','oppose')">Oppose</button>
`

})

document.getElementById("community").innerHTML = html

}



async function vote(zip,issue,vote){

await fetch(API+"/vote/"+zip+"/"+issue+"/"+vote,{
method:"POST"
})

alert("Vote recorded")

}
