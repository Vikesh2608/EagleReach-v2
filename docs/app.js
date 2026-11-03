'use strict';

// ---------------------------------------------------------------------------
// EagleReach frontend
// Static site on GitHub Pages; civic + news data come from the FastAPI backend
// on Render. Weather (Open-Meteo) and alerts (National Weather Service) are
// called directly from the browser.
// ---------------------------------------------------------------------------

const API = 'https://eaglereach-v2.onrender.com';
const $ = id => document.getElementById(id);

const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const allowedLink = u => {
  try {
    const x = new URL(u);
    return ['https:', 'http:'].includes(x.protocol) ? x.href : '#';
  } catch {
    return '#';
  }
};

const state = { city: '', stateAbbr: '', zip: '', news: 'local', coords: null, tz: null, point: null };

function status(s) { $('status').textContent = s; }

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

async function json(url, ms = 16000) {
  const r = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!r.ok) {
    const err = Error('Service unavailable (' + r.status + ')');
    err.status = r.status;
    throw err;
  }
  return r.json();
}

// Render's free plan sleeps after ~15 idle minutes and needs 30-60 s to wake.
// Ping it as soon as the page opens so it is usually awake by the first search.
let serverAwake = false;
const wakeUp = json(API + '/health', 75000)
  .then(() => { serverAwake = true; })
  .catch(() => {});

// Call the backend; if it is still waking up, tell the visitor and retry once
// with a longer timeout. Real errors (400/404) are not retried.
async function api(path, onWaiting) {
  try {
    return await json(API + path, serverAwake ? 16000 : 20000);
  } catch (e) {
    if (e.status && e.status < 500) throw e;
    if (onWaiting) onWaiting();
    await wakeUp;
    return json(API + path, 60000);
  }
}

const wakingMessage = () => {
  const msg = t('Waking up the EagleReach server — the first search can take up to a minute…');
  status(msg);
  if ($('leaders').textContent === t('Loading representatives…')) $('leaders').textContent = msg;
};

// ---------------------------------------------------------------------------
// Nearby care (map search links)
// ---------------------------------------------------------------------------

const careQueries = ['emergency hospital', 'CVS Pharmacy', 'urgent care', 'Walgreens Pharmacy'];

function updateCareMaps() {
  document.querySelectorAll('#emergency .care-card').forEach((card, i) => {
    const q = careQueries[i];
    if (!q) return;
    const loc = state.coords
      ? `${state.coords.lat.toFixed(5)},${state.coords.lon.toFixed(5)}`
      : state.zip;
    const phrase = loc ? `${q} near ${loc}` : `${q} near me`;
    const links = card.querySelectorAll('.map-actions a');
    if (links[0]) {
      links[0].href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(phrase);
    }
    if (links[1]) {
      links[1].href = 'https://maps.apple.com/?q=' + encodeURIComponent(q) +
        (state.coords ? '&sll=' + encodeURIComponent(loc) : '&near=' + encodeURIComponent(state.zip || ''));
    }
  });

  const label = $('careLocation');
  if (label) {
    label.textContent = state.coords
      ? t('Using your permitted device location for map searches.')
      : state.zip
        ? t('Showing map searches near ZIP {zip}.', { zip: state.zip })
        : t('Enter a ZIP above or allow location access for more relevant map searches.');
  }
}

// ---------------------------------------------------------------------------
// Weather forecast (Open-Meteo) and alerts (National Weather Service)
// ---------------------------------------------------------------------------

// WMO weather codes -> description and icon (day/night variants).
function weatherInfo(code, isDay = 1) {
  const day = isDay !== 0;
  if (code === 0) return { text: 'Clear', icon: day ? '☀️' : '🌙' };
  if (code === 1) return { text: 'Mostly clear', icon: day ? '🌤️' : '🌙' };
  if (code === 2) return { text: 'Partly cloudy', icon: day ? '⛅' : '☁️' };
  if (code === 3) return { text: 'Cloudy', icon: '☁️' };
  if (code <= 48) return { text: 'Fog', icon: '🌫️' };
  if (code <= 55) return { text: 'Drizzle', icon: day ? '🌦️' : '🌧️' };
  if (code <= 57) return { text: 'Freezing drizzle', icon: '🌧️' };
  if (code === 61) return { text: 'Light rain', icon: '🌧️' };
  if (code === 63) return { text: 'Rain', icon: '🌧️' };
  if (code <= 65) return { text: 'Heavy rain', icon: '🌧️' };
  if (code <= 67) return { text: 'Freezing rain', icon: '🌧️' };
  if (code <= 75) return { text: 'Snow', icon: '🌨️' };
  if (code === 77) return { text: 'Snow grains', icon: '🌨️' };
  if (code <= 82) return { text: 'Showers', icon: day ? '🌦️' : '🌧️' };
  if (code <= 86) return { text: 'Snow showers', icon: '🌨️' };
  if (code === 95) return { text: 'Thunderstorms', icon: '⛈️' };
  return { text: 'Thunderstorms with hail', icon: '⛈️' };
}

// Kept for anything that only needs an icon.
function weatherIcon(code, isDay = 1) { return weatherInfo(code, isDay).icon; }

// Background theme for the weather card, based on current conditions.
function weatherTheme(code, isDay) {
  const night = isDay === 0;
  if (code >= 95) return 'wx-storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return night ? 'wx-night-dim' : 'wx-snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return night ? 'wx-night-dim' : 'wx-rain';
  if (code === 45 || code === 48) return night ? 'wx-night-dim' : 'wx-fog';
  if (code === 3) return night ? 'wx-night-dim' : 'wx-cloudy';
  if (night) return 'wx-night';
  return code === 2 ? 'wx-partly' : 'wx-clear';
}

// Temperature (°F) -> color, from icy blue to hot red, for the range bars.
function tempColor(f) {
  const stops = [[10, [94, 159, 255]], [35, [90, 200, 250]], [50, [99, 211, 198]], [62, [166, 224, 90]],
                 [74, [255, 214, 10]], [85, [255, 159, 10]], [97, [255, 69, 58]]];
  if (f <= stops[0][0]) return `rgb(${stops[0][1]})`;
  for (let i = 1; i < stops.length; i++) {
    if (f <= stops[i][0]) {
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i], k = (f - t0) / (t1 - t0);
      return `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(',')})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1]})`;
}

function compass(deg) {
  const dirs = LANG === 'es' ? ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

function uvLabel(uv) {
  if (uv < 3) return t('Low');
  if (uv < 6) return t('Moderate');
  if (uv < 8) return t('High');
  if (uv < 11) return t('Very high');
  return t('Extreme');
}

// Open-Meteo returns local times without a zone ("2026-11-02T18:45"); parsing and
// formatting them the same way keeps the location's own clock time.
function localHour(str) {
  return new Date(str).toLocaleTimeString(LOCALE, { hour: 'numeric' });
}
function localTime(str) {
  return new Date(str).toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' });
}

async function weather(lat, lon) {
  alerts(lat, lon);
  try {
    const d = await json(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m,wind_direction_10m' +
      '&hourly=temperature_2m,weather_code,precipitation_probability,is_day' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max' +
      '&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7'
    );
    if (d.timezone) state.tz = d.timezone;
    state.point = { lat, lon };
    tickClock();
    $('updatedAt').textContent = ' · ' + t('Forecast updated {time}, refreshes every 10 min', { time: clockText(new Date(), false) });

    const c = d.current, daily = d.daily, hourly = d.hourly || {};
    const now = weatherInfo(c.weather_code, c.is_day);
    const temp = Math.round(c.temperature_2m);
    const hi = Math.round(daily.temperature_2m_max[0]);
    const lo = Math.round(daily.temperature_2m_min[0]);

    $('heroTemp').textContent = temp + '°F';
    if (!$('heroConditions').dataset.alert) $('heroConditions').textContent = now.icon + ' ' + t(now.text);

    // Card background follows the sky.
    const panel = $('forecast');
    panel.className = panel.className.replace(/\bwx-[\w-]+/g, '').trim() + ' ' + weatherTheme(c.weather_code, c.is_day);

    // Hourly: from the current hour, next 24 hours.
    let start = (hourly.time || []).findIndex(h => h.slice(0, 13) === String(c.time || '').slice(0, 13));
    if (start < 0) start = 0;
    const hours = (hourly.time || []).slice(start, start + 24).map((h, k) => {
      const i = start + k;
      const info = weatherInfo(hourly.weather_code[i], hourly.is_day[i]);
      const rain = hourly.precipitation_probability ? hourly.precipitation_probability[i] : null;
      return `
        <div class="wx-hour">
          <span class="wx-hour-time">${k === 0 ? t('Now') : safe(localHour(h))}</span>
          <span class="wx-hour-icon" title="${safe(t(info.text))}">${info.icon}</span>
          <span class="wx-rain">${rain >= 20 ? rain + '%' : ''}</span>
          <b>${Math.round(k === 0 ? c.temperature_2m : hourly.temperature_2m[i])}°</b>
        </div>`;
    }).join('');

    // 7-day list with Apple-style temperature range bars.
    const weekMin = Math.min(...daily.temperature_2m_min);
    const weekMax = Math.max(...daily.temperature_2m_max);
    const span = Math.max(1, weekMax - weekMin);
    const days = daily.time.map((day, i) => {
      const info = weatherInfo(daily.weather_code[i], 1);
      const dlo = daily.temperature_2m_min[i], dhi = daily.temperature_2m_max[i];
      const left = ((dlo - weekMin) / span) * 100, width = Math.max(4, ((dhi - dlo) / span) * 100);
      const rain = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : null;
      const dot = i === 0
        ? `<i class="wx-dot" style="left:${Math.min(100, Math.max(0, ((c.temperature_2m - weekMin) / span) * 100))}%"></i>` : '';
      const name = i === 0 ? t('Today')
        : new Date(day + 'T12:00:00').toLocaleDateString(LOCALE, { weekday: 'short' });
      return `
        <div class="wx-day">
          <span class="wx-day-name">${safe(name)}</span>
          <span class="wx-day-icon" title="${safe(t(info.text))}">${info.icon}<small class="wx-rain">${rain >= 20 ? rain + '%' : ''}</small></span>
          <span class="wx-lo">${Math.round(dlo)}°</span>
          <span class="wx-bar"><span class="wx-fill" style="left:${left}%;width:${width}%;background:linear-gradient(90deg,${tempColor(dlo)},${tempColor(dhi)})"></span>${dot}</span>
          <span class="wx-hi">${Math.round(dhi)}°</span>
        </div>`;
    }).join('');

    // Detail tiles.
    const feels = Math.round(c.apparent_temperature);
    const feelsNote = Math.abs(feels - temp) < 3 ? t('Similar to the actual temperature.')
      : feels < temp ? t('Wind is making it feel cooler.') : t('Humidity is making it feel warmer.');
    const uv = Math.round(daily.uv_index_max ? daily.uv_index_max[0] : 0);
    const tile = (icon, label, value, note = '') => `
      <div class="wx-tile">
        <span class="wx-tile-label">${icon} ${safe(label)}</span>
        <b>${value}</b>
        ${note ? `<small>${note}</small>` : ''}
      </div>`;
    const tiles = [
      tile('🌡️', t('Feels like'), feels + '°', safe(feelsNote)),
      tile('💧', t('Humidity'), Math.round(c.relative_humidity_2m) + '%'),
      tile('💨', t('Wind'), Math.round(c.wind_speed_10m) + ' <span class="wx-unit">mph</span>', safe(compass(c.wind_direction_10m || 0))),
      tile('🔆', t('UV index'), uv, safe(uvLabel(uv))),
      tile('🌅', t('Sunrise'), safe(localTime(daily.sunrise[0]))),
      tile('🌇', t('Sunset'), safe(localTime(daily.sunset[0])))
    ].join('');

    $('weather').innerHTML = `
      <div class="wx-now">
        ${state.city ? `<div class="wx-place">${safe(state.city)}</div>` : ''}
        <div class="wx-temp">${temp}°</div>
        <div class="wx-cond">${now.icon} ${safe(t(now.text))}</div>
        <div class="wx-hl">${safe(t('H:{hi}°  L:{lo}°', { hi, lo }))}</div>
      </div>
      <section class="wx-glass">
        <h4>🕒 ${safe(t('Hourly forecast'))}</h4>
        <div class="wx-hours" tabindex="0" aria-label="${safe(t('Hourly forecast'))}">${hours}</div>
      </section>
      <section class="wx-glass">
        <h4>📅 ${safe(t('7-day forecast'))}</h4>
        <div class="wx-days">${days}</div>
      </section>
      <div class="wx-tiles">${tiles}</div>`;
  } catch {
    $('weather').textContent = t('Forecast is temporarily unavailable.');
  }
}

function severityClass(sev) {
  return { Extreme: 'severe', Severe: 'severe', Moderate: 'moderate' }[sev] || 'minor';
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleString(LOCALE, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

async function alerts(lat, lon) {
  const box = $('alerts');
  if (!box) return;
  const point = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
  const details = `https://forecast.weather.gov/MapClick.php?lat=${Number(lat).toFixed(4)}&lon=${Number(lon).toFixed(4)}`;
  try {
    const d = await json('https://api.weather.gov/alerts/active?point=' + point, 12000);
    const list = (d.features || []).map(f => f.properties || {}).slice(0, 3);

    if (!list.length) {
      delete $('heroConditions').dataset.alert;
      box.innerHTML = '<p class="alert-none">✅ ' + t('No active weather alerts for this area.') + '</p>';
      return;
    }

    $('heroConditions').dataset.alert = '1';
    $('heroConditions').textContent = '⚠️ ' + t(list.length > 1 ? '{n} active weather alerts' : '{n} active weather alert', { n: list.length });
    box.innerHTML = list.map(a => {
      const until = formatTime(a.ends || a.expires);
      return `
        <div class="alert-card ${severityClass(a.severity)}" role="alert">
          <strong>⚠️ ${safe(a.event || t('Weather alert'))}</strong>
          ${a.headline ? `<p>${safe(a.headline)}</p>` : ''}
          <small>${until ? safe(t('Until {time}', { time: until })) + ' · ' : ''}${safe(t('Source: National Weather Service'))} ·
            <a href="${safe(details)}" target="_blank" rel="noopener noreferrer">${safe(t('Details'))} ↗</a></small>
        </div>`;
    }).join('');
  } catch {
    // Alerts are a bonus; if NWS is unreachable we keep whatever was shown before.
  }
}

// ---------------------------------------------------------------------------
// Representatives
// ---------------------------------------------------------------------------

function partyClass(p) {
  p = String(p || '').toLowerCase();
  return p.startsWith('dem') ? 'dem' : p.startsWith('rep') ? 'gop' : p ? 'ind' : '';
}

function reps(items) {
  if (!Array.isArray(items) || !items.length) {
    $('leaders').textContent =
      t('Representative information is unavailable for this ZIP. Check your officials using your full street address at USA.gov.');
    return;
  }
  $('leaders').innerHTML = '<div class="rep-list">' + items.map(r => {
    const tel = String(r.phone || '').replace(/[^0-9]/g, '');
    const photo = r.photo
      ? `<img src="${safe(allowedLink(r.photo))}" alt="" loading="lazy" onerror="this.remove()">`
      : '<span class="rep-icon" aria-hidden="true">🏛️</span>';
    return `
      <div class="rep-card">
        ${photo}
        <div>
          <strong>${safe(trText(r.name || 'Official'))}</strong>
          <small>${safe(trText(r.role || ''))}</small>
          ${r.party ? `<span class="party ${partyClass(r.party)}">${safe(trText(r.party))}</span>` : ''}
          <div class="rep-links">
            ${tel.length >= 10 ? `<a href="tel:${tel}">☎ ${safe(r.phone)}</a>` : ''}
            ${r.link ? `<a href="${safe(allowedLink(r.link))}" target="_blank" rel="noopener noreferrer">${safe(t('Website'))} ↗</a>` : ''}
          </div>
        </div>
      </div>`;
  }).join('') + '</div>';
}

// ---------------------------------------------------------------------------
// ZIP search and device location
// ---------------------------------------------------------------------------

async function searchZip(zip, coords = null) {
  if (!/^\d{5}$/.test(zip)) {
    status(t('Enter a valid 5-digit U.S. ZIP code.'));
    return;
  }
  state.zip = zip;
  state.coords = coords;
  state.city = '';
  state.stateAbbr = '';
  state.tz = null;
  state.point = null;
  $('updatedAt').textContent = '';
  updateCareMaps();

  // Clear anything left over from a previous search.
  $('heroTemp').textContent = '--°F';
  $('heroConditions').textContent = t('Weather pending');
  delete $('heroConditions').dataset.alert;
  $('weather').textContent = t('Loading forecast…');
  $('alerts').innerHTML = '';
  $('leaders').textContent = t('Loading representatives…');
  $('results').hidden = false;
  document.body.classList.add('searched');
  if ($('startBar')) $('startBar').hidden = true;
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('resultTitle').textContent = t('Community resources for {zip}', { zip });
  status(t('Loading location, weather and civic information…'));

  const coordQuery = coords ? `&lat=${coords.lat.toFixed(4)}&lon=${coords.lon.toFixed(4)}` : '';
  try {
    const d = await api(`/api/civic?zip=${encodeURIComponent(zip)}${coordQuery}`, wakingMessage);
    state.city = d.city || '';
    state.stateAbbr = d.state || '';
    $('resultTitle').textContent = [d.city, d.state].filter(Boolean).join(', ') || t('Community {zip}', { zip });
    $('resultSubtitle').textContent =
      'ZIP ' + zip + (d.district_source ? ' · ' + t('House district based on {src}', { src: t(d.district_source) }) : '');
    $('heroCity').textContent = state.city || t('Your area');
    reps(d.representatives);

    const lat = coords ? coords.lat : Number(d.lat);
    const lon = coords ? coords.lon : Number(d.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) await weather(lat, lon);
    else $('weather').textContent = t('Forecast location unavailable.');
    status(t('Location loaded.'));
    setShareUrl(zip);
    loadNews();
  } catch (e) {
    status(e.status === 404 ? t('That ZIP code was not found.') : t('Civic data could not load: {msg}', { msg: e.message }));
    $('weather').textContent = t('Forecast location unavailable.');
    $('leaders').innerHTML =
      '<a href="https://www.usa.gov/elected-officials" target="_blank" rel="noopener noreferrer">' + safe(t('Find your elected officials on USA.gov')) + ' ↗</a>';
    // Fall back to a direct ZIP lookup so weather and news still work.
    try {
      const z = await json('https://api.zippopotam.us/us/' + zip);
      const p = z.places?.[0];
      if (p) {
        state.city = p['place name'];
        state.stateAbbr = p['state abbreviation'];
        $('resultTitle').textContent = state.city + ', ' + state.stateAbbr;
        $('heroCity').textContent = state.city;
        await weather(Number(p.latitude), Number(p.longitude));
        setShareUrl(zip);
        loadNews();
      }
    } catch {}
  }
}

function useLocation() {
  if (!navigator.geolocation) {
    status(t('Location is not supported by this browser.'));
    return;
  }
  status(t('Requesting location permission…'));
  locateBusy(true);
  navigator.geolocation.getCurrentPosition(async p => {
    try {
      const d = await json(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${p.coords.latitude}` +
        `&longitude=${p.coords.longitude}&localityLanguage=en`
      );
      const zip = d.postcode;
      if (!/^\d{5}$/.test(zip || '')) throw Error(t('No U.S. ZIP code found'));
      $('zip').value = zip;
      locateBusy(false);
      searchZip(zip, { lat: p.coords.latitude, lon: p.coords.longitude });
    } catch (e) {
      locateFailed(t('Unable to determine ZIP: {msg}', { msg: e.message }));
    }
  }, e => locateFailed(e.code === 1
    ? t('Location permission was turned off. Type your ZIP code instead, or allow location in your browser settings.')
    : t('Location unavailable: {msg}', { msg: e.message })), { timeout: 12000, enableHighAccuracy: false });
}

// Show progress on the location buttons themselves (the status line may be off-screen).
function locateBusy(on) {
  ['locateHero', 'locateBar'].forEach(id => {
    const b = $(id);
    if (!b) return;
    if (!b.dataset.label) b.dataset.label = b.textContent;
    b.disabled = on;
    b.textContent = on ? '⏳ ' + t('Finding you…') : b.dataset.label;
  });
}

function locateFailed(msg) {
  locateBusy(false);
  status(msg);
  if ($('startBar')) $('startBar').hidden = true;
  document.getElementById('home').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('zip').focus({ preventScroll: true });
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

function timeAgo(iso) {
  const ts = Date.parse(iso);
  if (!ts) return '';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return t('just now');
  if (mins < 60) return t('{n} min ago', { n: mins });
  if (mins < 1440) return t('{n} h ago', { n: Math.round(mins / 60) });
  return t('{n} d ago', { n: Math.round(mins / 1440) });
}

async function loadNews(quiet = false) {
  const type = state.news;
  const box = $('newsCards');

  if (type === 'local' && !state.city) {
    box.innerHTML = '<div class="panel">' + t('Enter a ZIP code above to see local headlines.') + '</div>';
    return;
  }
  if (!quiet) box.innerHTML = '<div class="panel">' + t('Loading headlines…') + '</div>';

  const path = type === 'local'
    ? `/api/news/local?city=${encodeURIComponent(state.city)}&state=${encodeURIComponent(state.stateAbbr)}&lang=${LANG}`
    : `/api/news/${type}?lang=${LANG}`;

  try {
    let news = await api(path, () => {
      if (state.news === type) box.innerHTML = '<div class="panel">' + t('Waking up the news server — this can take up to a minute…') + '</div>';
    });
    if (state.news !== type) return; // visitor switched tabs while this was loading
    if (!Array.isArray(news)) news = news.articles || news.items || [];
    if (!news.length) throw Error('No headlines returned');

    box.innerHTML = news.slice(0, 12).map(n => {
      const source = n.source?.name || n.source || 'News';
      const when = timeAgo(n.published)
        ? ` · <time datetime="${safe(n.published)}">${safe(timeAgo(n.published))}</time>` : '';
      return `
        <article class="news-card">
          <small>${safe(source)}${when}</small>
          <h3>${safe(n.title || 'Headline')}</h3>
          <a href="${safe(allowedLink(n.link || n.url))}" target="_blank" rel="noopener noreferrer">${safe(t('Read article'))} ↗</a>
        </article>`;
    }).join('');
  } catch {
    if (state.news !== type || (quiet && box.querySelector('.news-card'))) return;
    box.innerHTML = `
      <div class="panel">
        <p>${safe(t('Headlines are temporarily unavailable.'))}</p>
        <a href="https://news.google.com/" target="_blank" rel="noopener noreferrer">${safe(t('Browse Google News'))} ↗</a>
      </div>`;
  }
}

// ---------------------------------------------------------------------------
// Live time: ticking clock, "x min ago" labels, and automatic refresh
// ---------------------------------------------------------------------------

function clockText(date, withSeconds = true) {
  const opts = { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
  if (withSeconds) { opts.weekday = 'short'; opts.second = '2-digit'; }
  try {
    return date.toLocaleTimeString(LOCALE, { ...opts, timeZone: state.tz || undefined });
  } catch {
    return date.toLocaleTimeString(LOCALE, opts);
  }
}

function tickClock() {
  const now = clockText(new Date());
  const where = state.city && state.tz ? ' ' + t('in {city}', { city: state.city }) : '';
  $('heroClock').textContent = '🕒 ' + now;
  $('localClock').textContent = state.point ? `🕒 ${now}${where}` : '';
}

function refreshTimeLabels() {
  document.querySelectorAll('#newsCards time[datetime]').forEach(el => {
    el.textContent = timeAgo(el.getAttribute('datetime'));
  });
}

setInterval(tickClock, 1000);
setInterval(refreshTimeLabels, 60 * 1000);
setInterval(() => {
  if (document.hidden) return; // don't refresh in a background tab
  if (state.point) weather(state.point.lat, state.point.lon);
  if (state.news !== 'local' || state.city) loadNews(true);
}, 10 * 60 * 1000);
tickClock();

// ---------------------------------------------------------------------------
// Shareable links: ?zip=45220 opens straight to that ZIP's results.
// Only the ZIP (and language) go in the link — never the visitor's coordinates.
// ---------------------------------------------------------------------------

function shareUrl(zip) {
  const u = new URL(location.href);
  u.search = '';
  u.searchParams.set('zip', zip);
  if (LANG !== 'en') u.searchParams.set('lang', LANG);
  u.hash = 'results';
  return u.href;
}

function setShareUrl(zip) {
  try { history.replaceState(null, '', shareUrl(zip)); } catch {}
}

async function shareResults() {
  if (!state.zip) return;
  const url = shareUrl(state.zip);
  const place = state.city ? `${state.city}, ${state.stateAbbr}` : 'ZIP ' + state.zip;
  const text = t('Representatives, weather alerts and local news for {place} on EagleReach', { place });
  const msg = $('shareMsg');
  if (navigator.share) {
    try { await navigator.share({ title: 'EagleReach', text, url }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(url);
    msg.textContent = '✓ ' + t('Link copied');
  } catch {
    msg.textContent = url; // last resort: show the link so it can be copied by hand
  }
  setTimeout(() => { if (msg.textContent.startsWith('✓')) msg.textContent = ''; }, 3000);
}

function searchFromUrl() {
  const zip = new URLSearchParams(location.search).get('zip');
  if (zip && /^\d{5}$/.test(zip)) {
    $('zip').value = zip;
    searchZip(zip);
  }
}

// ---------------------------------------------------------------------------
// Mobile "start" bar: appears once the visitor scrolls past the search box
// without having searched yet, so they always know how to begin.
// ---------------------------------------------------------------------------

function setupStartBar() {
  const bar = $('startBar');
  const hero = document.querySelector('.hero');
  if (!bar || !hero || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => {
    bar.hidden = entry.isIntersecting || document.body.classList.contains('searched');
  }).observe(hero);
  $('locateBar').addEventListener('click', useLocation);
  bar.querySelector('.start-bar-zip').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('home').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => $('zip').focus({ preventScroll: true }), 400);
  });
}

// ---------------------------------------------------------------------------
// Wire up the page
// ---------------------------------------------------------------------------

$('searchForm').addEventListener('submit', e => {
  e.preventDefault();
  searchZip($('zip').value.trim());
});
$('locateHero').addEventListener('click', useLocation);
$('locateTop').addEventListener('click', useLocation);
$('shareBtn').addEventListener('click', shareResults);

document.querySelectorAll('[data-news]').forEach(b => b.addEventListener('click', () => {
  state.news = b.dataset.news;
  document.querySelectorAll('[data-news]').forEach(x => {
    x.classList.toggle('active', x === b);
    x.setAttribute('aria-selected', String(x === b));
  });
  loadNews();
}));

updateCareMaps();
setupStartBar();
searchFromUrl();
