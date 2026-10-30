# 🦅 EagleReach — Your Community, Connected.

**An independent, nonpartisan civic intelligence and community resource platform.**

EagleReach helps people discover civic information, local weather, healthcare resources, emergency contacts, public assistance information, and news through one accessible website.

**[🌐 Explore the live platform](https://vikesh2608.github.io/EagleReach-v2/)** · **[💻 Browse the source](https://github.com/Vikesh2608/EagleReach-v2)** · **[👥 Meet the team](https://vikesh2608.github.io/EagleReach-v2/founder.html)**

---

## Our mission

Access to useful public information should be straightforward. EagleReach brings together links to trusted resources and location-relevant information to help individuals navigate their communities.

The project is independently developed and is **not affiliated with or endorsed by any government agency, emergency-response organization, hospital, or pharmacy**.

## What EagleReach offers

| Area | Current functionality |
| --- | --- |
| 🏛️ Civic information | ZIP-based representative information when available; links to official civic resources |
| 🌤️ Weather | Seven-day forecast using Open-Meteo |
| 🚑 Emergency support | Quick-call links for U.S. 911 and 988, plus additional helplines |
| 🏥 Healthcare | Google Maps and Apple Maps searches for hospitals, urgent care, CVS and Walgreens, using a ZIP or permitted device location |
| 🤝 Public assistance | Links to official information about food, housing and government benefits |
| 📰 News | Local and world headline feeds where available; links to external coverage for other categories |
| 📍 Location | Five-digit U.S. ZIP search and optional browser geolocation, subject to user permission |

**Important:** Healthcare map links open external search services. EagleReach does not currently verify facility hours, availability, medical services or benefit eligibility. If someone is in immediate danger in the U.S., call **911**. For suicide or mental health crisis support in the U.S., call or text **988**.

## Screenshots

Explore the [live EagleReach homepage](https://vikesh2608.github.io/EagleReach-v2/) to see the current interface. Project screenshots can be added here in a future documentation update.

## Technology

- **Frontend:** HTML5, CSS3, vanilla JavaScript
- **Backend:** Python, FastAPI, REST endpoints
- **Hosting:** GitHub Pages (frontend), Render (backend)
- **Weather:** Open-Meteo
- **Location:** Browser Geolocation API, reverse geocoding, ZIP-code lookup
- **Maps:** Google Maps search links and Apple Maps search links
- **Civic and news data:** Backend integrations and external public-information sources

## Architecture

```text
Visitor
  |
  +-- GitHub Pages: HTML / CSS / JavaScript
  |     |
  |     +-- ZIP input or optional device location
  |     +-- Open-Meteo weather forecast
  |     +-- Google Maps / Apple Maps healthcare searches
  |     +-- Official public-service links
  |
  +-- FastAPI service hosted on Render
        |
        +-- Civic information
        +-- Local / world news feeds
```

Data and external service availability may vary. The frontend handles some unavailable services with fallbacks.

## Run locally

1. Clone this repository:
   ```bash
   git clone https://github.com/Vikesh2608/EagleReach-v2.git
   cd EagleReach-v2
   ```
2. Start a local web server for the frontend:
   ```bash
   cd docs
   python -m http.server 8000
   ```
3. Open **http://localhost:8000** in your browser.

The deployed frontend calls the public EagleReach backend hosted on Render. Some location functions require a secure context, such as HTTPS or localhost. You can inspect the backend code and configuration in the repository before running it separately.

## Project team

**Vikesh Sagar Bairam** — Founder & Lead Developer  
Project concept, architecture, application development, integrations and deployment.

**Keerthi Peddireddy** — Junior Developer · Community Welfare & Public Services Contributor  
Contributed the direction to expand EagleReach's community-welfare focus toward healthcare benefits, government assistance and essential public services.

Learn more on the [Founder & Team page](https://vikesh2608.github.io/EagleReach-v2/founder.html).

## Feedback and collaboration

EagleReach welcomes thoughtful feedback from developers, civic technologists, researchers, public-service organizations and community members.

- Browse the repository and [open an issue](https://github.com/Vikesh2608/EagleReach-v2/issues) to report bugs or suggest improvements.
- Discuss substantial changes in an issue before preparing a pull request.
- Do not submit private information, credentials, medical records or personal location details in public issues.

**Code reuse:** Public source visibility does not automatically grant permission to redistribute or reuse the code. No open-source license is declared here; a license may be added after the maintainers choose its terms.

## Independence and limitations

EagleReach is an informational project, not an official government portal, healthcare provider, emergency dispatch service, or a substitute for professional advice. External sites maintain their own content and privacy practices. Civic information should be confirmed with official sources, particularly where ZIP codes cross electoral district boundaries.

---

**EagleReach — Your Community, Connected.**  
*Technology for accessible information and stronger communities.*
