# 🇺🇸 EagleReach – Civic Intelligence Platform

Empowering citizens with real-time civic intelligence — access representatives, news, weather, and emergency services based on your location.

🔗 **Live App:** https://vikesh2608.github.io/EagleReach-v2/  
💻 **GitHub Repo:** https://github.com/Vikesh2608/EagleReach-v2  

---

## 🚀 Overview

EagleReach is a full-stack civic technology platform designed to improve public access to government and community information.

Users can enter a ZIP code or use their location to instantly retrieve:

- Government representatives (federal & local)
- Local and global news
- 7-day weather forecast
- Emergency service information
- Civic resources for engagement

This project demonstrates **end-to-end system design**, combining backend APIs, frontend UI, and cloud deployment.

---

## 🧠 Key Highlights

- 🌍 Location-based civic intelligence
- 🏛️ Representative lookup using U.S. Census data
- 📰 Real-time local & global news aggregation
- 🌦️ 7-day weather forecast with visual indicators
- 🚨 Emergency services integration (911, 988, etc.)
- ⚡ Fully deployed cloud architecture
- 🔁 CI/CD pipeline with GitHub Actions

---

## ⚙️ Tech Stack

### Frontend
- HTML
- CSS (Startup-style responsive UI)
- JavaScript (Vanilla)

### Backend
- FastAPI (Python)
- REST API architecture

### APIs & Data Sources
- U.S. Census API (geolocation & districts)
- OpenWeather API (weather forecasts)
- News aggregation APIs (Google News RSS)

### Cloud & DevOps
- Render (Backend hosting)
- GitHub Pages (Frontend hosting)
- GitHub Actions (CI/CD pipeline)

---

## 🏗️ Architecture

```text
User → Frontend (GitHub Pages)
     → FastAPI Backend (Render)
         → Census API
         → Weather API
         → News APIs
