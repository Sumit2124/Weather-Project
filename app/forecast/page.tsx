"use client";

import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Day = {
  date: string; condition: string; emoji: string; temperature: number; feelsLike: number;
  high: number; low: number; rain: number; wind: number; gust: number; precipitation: number;
  humidity: number; uv: number; sunshineHours: number; daylightHours: number; sunrise: string; sunset: string;
};

type Hour = { time: string; temperature: number; rain: number; wind: number; visibility: number; emoji: string };
type Health = { aqi: number | null; pm25: number | null; pm10: number | null; pollen: number | null };
type History = { high: number; low: number; rain: number };

const skies: Record<number, { condition: string; emoji: string }> = {
  0: { condition: "Clear skies", emoji: "☀️" }, 1: { condition: "Mostly clear", emoji: "🌤️" },
  2: { condition: "Partly cloudy", emoji: "⛅" }, 3: { condition: "Cloudy", emoji: "☁️" },
  45: { condition: "Foggy", emoji: "🌫️" }, 48: { condition: "Frosty fog", emoji: "🌫️" },
  51: { condition: "Light drizzle", emoji: "🌦️" }, 53: { condition: "Drizzle", emoji: "🌦️" },
  55: { condition: "Heavy drizzle", emoji: "🌧️" }, 61: { condition: "Light rain", emoji: "🌦️" },
  63: { condition: "Rain", emoji: "🌧️" }, 65: { condition: "Heavy rain", emoji: "🌧️" },
  71: { condition: "Snowfall", emoji: "🌨️" }, 73: { condition: "Snowy", emoji: "🌨️" },
  75: { condition: "Heavy snow", emoji: "❄️" }, 80: { condition: "Rain showers", emoji: "🌦️" },
  81: { condition: "Rain showers", emoji: "🌧️" }, 82: { condition: "Stormy showers", emoji: "⛈️" },
  95: { condition: "Thunderstorm", emoji: "⛈️" }, 96: { condition: "Thunderstorm + hail", emoji: "⛈️" },
  99: { condition: "Thunderstorm + hail", emoji: "⛈️" },
};

const fallback: Day = { date: "", condition: "Loading the sky…", emoji: "🌤️", temperature: 0, feelsLike: 0, high: 0, low: 0, rain: 0, wind: 0, gust: 0, precipitation: 0, humidity: 0, uv: 0, sunshineHours: 0, daylightHours: 0, sunrise: "--:--", sunset: "--:--" };

function label(value: string) {
  if (!value) return "Selected day";
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
}

function shortDay(value: string) { return new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(new Date(`${value}T12:00:00`)); }
function time(value?: string) { return value?.slice(11, 16) ?? "--:--"; }

function vibe(day: Day) {
  const score = Math.max(18, Math.min(96, Math.round(100 - day.rain * .55 - Math.max(day.uv - 7, 0) * 5 - Math.max(day.wind - 24, 0) * .75)));
  if (score >= 76) return { score, title: "Go outside", note: "Great window for plans" };
  if (score >= 52) return { score, title: "Flexible plans", note: "Carry a small backup" };
  return { score, title: "Indoor energy", note: "The sofa wins today" };
}

function roast(day: Day) {
  if (day.rain >= 60) return "Umbrella le jao—confidence waterproof nahi hota, dost. ☔";
  if (day.high >= 34) return "Dhoop itni serious hai ki sunscreen bhi notice period maang rahi hai. 🥵";
  if (day.wind >= 25) return "Hawa ka confidence dekh ke hairstyle ne resignation de diya. 💨";
  return "Weather sorted hai. Ab group chat plans cancel kare toh uski problem. 😌";
}

function hourScore(hour: Hour) { return Math.max(5, Math.min(99, Math.round(100 - hour.rain * .65 - Math.abs(hour.temperature - 24) * 2.1 - Math.max(0, hour.wind - 18)))); }
function bestHour(hours: Hour[]) {
  const usable = hours.filter((hour) => Number(hour.time.slice(11, 13)) >= 6 && Number(hour.time.slice(11, 13)) <= 21);
  const best = [...usable].sort((a, b) => hourScore(b) - hourScore(a))[0];
  if (!best) return { label: "Loading…", score: 0 };
  const start = best.time.slice(11, 16); const end = `${String((Number(start.slice(0, 2)) + 1) % 24).padStart(2, "0")}:00`;
  return { label: `${start}–${end}`, score: hourScore(best) };
}
function period(timeValue: string) { const hour = Number(timeValue.slice(11, 13)); return hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"; }
function pack(day: Day) { const items = ["Water bottle", "Power bank", "Comfy shoes"]; if (day.rain >= 35) items.push("Compact umbrella", "Rain cover"); if (day.high >= 30 || day.uv >= 6) items.push("SPF 50", "Sunglasses"); if (day.low <= 18) items.push("Light jacket"); if (day.wind >= 24) items.push("Windbreaker"); return items.slice(0, 8); }
function aqiName(value: number | null) { if (value == null) return "Loading"; if (value <= 50) return "Good"; if (value <= 100) return "Moderate"; if (value <= 150) return "Sensitive caution"; return "Unhealthy"; }
function animationKind(condition: string) {
  const value = condition.toLowerCase();
  if (value.includes("snow") || value.includes("frost")) return "snow";
  if (value.includes("rain") || value.includes("drizzle") || value.includes("shower")) return "rain";
  if (value.includes("thunder")) return "storm";
  if (value.includes("wind") || value.includes("fog")) return "wind";
  return "sun";
}

export default function ForecastPage() {
  const [city, setCity] = useState("Your destination");
  const [country, setCountry] = useState("");
  const [coords, setCoords] = useState({ lat: "", lon: "" });
  const [selected, setSelected] = useState<Day>(fallback);
  const [week, setWeek] = useState<Day[]>([]);
  const [hours, setHours] = useState<Hour[]>([]);
  const [health, setHealth] = useState<Health>({ aqi: null, pm25: null, pm10: null, pollen: null });
  const [history, setHistory] = useState<History | null>(null);
  const [compareQuery, setCompareQuery] = useState("Mumbai, Bengaluru");
  const [compareResults, setCompareResults] = useState<{ city: string; high: number; rain: number; score: number; emoji: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const prefetchedDays = useRef(new Set<string>());
  const mood = useMemo(() => vibe(selected), [selected]);
  const best = useMemo(() => bestHour(hours), [hours]);
  const visibleHours = useMemo(() => hours.filter((hour, index) => index % 2 === 0 || best.label.startsWith(hour.time.slice(11, 16))), [hours, best.label]);
  const tripScores = useMemo(() => [{ label: "Overall trip", icon: "✦", value: mood.score }, { label: "Outdoor plans", icon: "🥾", value: Math.max(10, mood.score - Math.round(selected.rain * .18)) }, { label: "Photography", icon: "📸", value: Math.max(12, 88 - Math.round(selected.rain * .28)) }, { label: "Easy driving", icon: "🚗", value: Math.max(8, 96 - Math.round(selected.rain * .55)) }, { label: "Hair safety", icon: "💇", value: Math.max(5, 100 - Math.round(selected.wind * 2.2)) }], [mood.score, selected]);
  const alerts = useMemo(() => { const items: { level: string; icon: string; title: string; note: string }[] = []; if (selected.rain >= 70 || selected.condition.includes("Thunder")) items.push({ level: "danger", icon: "⛈", title: "Storm watch", note: "Heavy rain or thunder may disrupt outdoor plans." }); if (selected.uv >= 8) items.push({ level: "warn", icon: "☀", title: "Very high UV", note: "Shade and SPF are strongly recommended." }); if (hours.some((hour) => hour.visibility < 3000)) items.push({ level: "warn", icon: "🌫", title: "Low visibility", note: "Allow extra travel time, especially while driving." }); return items; }, [selected, hours]);
  const radarUrl = useMemo(() => coords.lat ? `https://embed.windy.com/embed2.html?lat=${coords.lat}&lon=${coords.lon}&zoom=7&level=surface&overlay=radar&product=radar&marker=true&calendar=now&type=map&location=coordinates&detailLat=${coords.lat}&detailLon=${coords.lon}&radarRange=-1&play=0` : "", [coords]);

  useEffect(() => {
    const closeMapOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMapReady(false); };
    window.addEventListener("keydown", closeMapOnEscape);
    return () => window.removeEventListener("keydown", closeMapOnEscape);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedCity = params.get("city") || "New Delhi";
    const requestedCountry = params.get("country") || "India";
    const requestedDate = params.get("date") || new Date().toISOString().slice(0, 10);
    setCity(requestedCity); setCountry(requestedCountry);

    async function load() {
      try {
        let lat = params.get("lat") || ""; let lon = params.get("lon") || "";
        if (!lat || !lon) {
          const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(requestedCity)}&count=1&language=en&format=json`).then((response) => response.json());
          lat = String(geo.results?.[0]?.latitude ?? ""); lon = String(geo.results?.[0]?.longitude ?? "");
        }
        if (!lat || !lon) throw new Error("Location unavailable");
        setCoords({ lat, lon });
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.search = new URLSearchParams({ latitude: lat, longitude: lon, timezone: "auto", forecast_days: "16", models: "best_match", hourly: "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,visibility", daily: "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunshine_duration,daylight_duration,sunrise,sunset" }).toString();
        const forecast = await fetch(url).then((response) => response.json());
        // Keep the navigator chronological: today first, followed by the next
        // six calendar days. The selected day is highlighted, never used to
        // reorder the week around itself.
        const dayIndices = Array.from({ length: 7 }, (_, index) => index).filter((index) => index < forecast.daily.time.length);
        const days: Day[] = dayIndices.map((index) => {
          const date = forecast.daily.time[index]; const sky = skies[forecast.daily.weather_code[index]] ?? skies[3];
          const humidities = forecast.hourly.time.reduce((values: number[], stamp: string, hourIndex: number) => stamp.startsWith(date) ? [...values, forecast.hourly.relative_humidity_2m[hourIndex]] : values, []);
          const humidity = humidities.length ? Math.round(humidities.reduce((sum, value) => sum + value, 0) / humidities.length) : 0;
          const high = Math.round(forecast.daily.temperature_2m_max[index]); const low = Math.round(forecast.daily.temperature_2m_min[index]);
          return { date, condition: sky.condition, emoji: sky.emoji, temperature: Math.round((high + low) / 2), feelsLike: Math.round(forecast.daily.apparent_temperature_max[index]), high, low, rain: Math.round(forecast.daily.precipitation_probability_max[index] ?? 0), wind: Math.round(forecast.daily.wind_speed_10m_max[index] ?? 0), gust: Math.round(forecast.daily.wind_gusts_10m_max[index] ?? 0), precipitation: Number((forecast.daily.precipitation_sum[index] ?? 0).toFixed(1)), humidity, uv: Math.round(forecast.daily.uv_index_max[index] ?? 0), sunshineHours: Number(((forecast.daily.sunshine_duration[index] ?? 0) / 3600).toFixed(1)), daylightHours: Number(((forecast.daily.daylight_duration[index] ?? 0) / 3600).toFixed(1)), sunrise: time(forecast.daily.sunrise[index]), sunset: time(forecast.daily.sunset[index]) };
        });
        setWeek(days); setSelected(days.find((day) => day.date === requestedDate) ?? days[0]);
        setHours(forecast.hourly.time.reduce((items: Hour[], stamp: string, index: number) => { if (!stamp.startsWith(requestedDate)) return items; const sky = skies[forecast.hourly.weather_code[index]] ?? skies[3]; items.push({ time: stamp, temperature: Math.round(forecast.hourly.temperature_2m[index]), rain: Math.round(forecast.hourly.precipitation_probability[index] ?? 0), wind: Math.round(forecast.hourly.wind_speed_10m[index] ?? 0), visibility: Math.round(forecast.hourly.visibility[index] ?? 10000), emoji: sky.emoji }); return items; }, []));

        const previous = new Date(`${requestedDate}T12:00:00`); previous.setFullYear(previous.getFullYear() - 1); const previousDate = previous.toISOString().slice(0, 10);
        const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&timezone=auto&current=us_aqi,pm2_5,pm10,grass_pollen,alder_pollen,birch_pollen,mugwort_pollen,ragweed_pollen`;
        const historyUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&timezone=auto&start_date=${previousDate}&end_date=${previousDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum`;
        const [airResult, historyResult] = await Promise.allSettled([fetch(airUrl).then((response) => response.json()), fetch(historyUrl).then((response) => response.json())]);
        if (airResult.status === "fulfilled") { const current = airResult.value.current ?? {}; const pollens = [current.grass_pollen,current.alder_pollen,current.birch_pollen,current.mugwort_pollen,current.ragweed_pollen].filter((value) => typeof value === "number"); setHealth({ aqi: current.us_aqi ?? null, pm25: current.pm2_5 ?? null, pm10: current.pm10 ?? null, pollen: pollens.length ? Math.max(...pollens) : null }); }
        if (historyResult.status === "fulfilled" && historyResult.value.daily?.time?.length) setHistory({ high: Math.round(historyResult.value.daily.temperature_2m_max[0]), low: Math.round(historyResult.value.daily.temperature_2m_min[0]), rain: Number((historyResult.value.daily.precipitation_sum[0] ?? 0).toFixed(1)) });
      } finally { setLoading(false); }
    }
    void load();
  }, []);

  function openDay(day: Day) {
    if (day.date === selected.date || navigating) return;
    setNavigating(true);
    const params = new URLSearchParams({ city, country, date: day.date, lat: coords.lat, lon: coords.lon });
    window.location.assign(`/forecast?${params.toString()}`);
  }

  function prefetchDay(day: Day) {
    if (!day.date || day.date === selected.date || prefetchedDays.current.has(day.date)) return;
    prefetchedDays.current.add(day.date);
    const params = new URLSearchParams({ city, country, date: day.date, lat: coords.lat, lon: coords.lon });
    void fetch(`/forecast?${params.toString()}`, { cache: "force-cache", credentials: "same-origin" }).catch(() => {
      prefetchedDays.current.delete(day.date);
    });
  }

  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${city}, ${label(selected.date)}. ${selected.condition}. High ${selected.high} degrees, low ${selected.low} degrees, with ${selected.rain} percent rain chance. Best time outside is ${best.label}.`);
    utterance.lang = "en-IN"; window.speechSynthesis.speak(utterance);
  }

  async function share() {
    const text = `${city} · ${label(selected.date)} · ${selected.condition} · ${selected.high}°/${selected.low}° · ${selected.rain}% rain`;
    try {
      if (navigator.share) await navigator.share({ title: `Mausam ka Mood · ${city}`, text });
      else { await navigator.clipboard.writeText(text); setShareNotice("Forecast copied to clipboard."); }
    } catch { setShareNotice("Share cancelled — your forecast is still here."); }
    window.setTimeout(() => setShareNotice(""), 3200);
  }

  async function compare(event: FormEvent) {
    event.preventDefault();
    const names = compareQuery.split(",").map((name) => name.trim()).filter(Boolean).slice(0, 3);
    const results = await Promise.all(names.map(async (name) => {
      const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`).then((response) => response.json()); const place = geo.results?.[0];
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&timezone=auto&forecast_days=16&daily=weather_code,temperature_2m_max,precipitation_probability_max`;
      const data = await fetch(url).then((response) => response.json()); const index = Math.max(0, data.daily.time.indexOf(selected.date)); const rain = Math.round(data.daily.precipitation_probability_max[index] ?? 0); const sky = skies[data.daily.weather_code[index]] ?? skies[3];
      return { city: place.name, high: Math.round(data.daily.temperature_2m_max[index]), rain, score: Math.max(10, Math.round(95-rain*.65)), emoji: sky.emoji };
    }));
    setCompareResults(results.sort((a,b) => b.score-a.score));
  }

  return <main className={`weather-app forecast-detail-page ${navigating ? "is-navigating" : ""}`}>
    {navigating && <div className="day-change-overlay" role="status" aria-live="polite"><span className="weather-loader">{selected.emoji}</span><b>Changing the sky…</b><small>Loading your selected day</small></div>}
    <nav className="topbar"><a className="brand" href="/"><span className="brand-mark">☼</span><span>Mausam <i>ka Mood</i></span></a><a className="detail-back" href={`/?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&date=${selected.date}&lat=${coords.lat}&lon=${coords.lon}`}>← View city data</a></nav>
    <section className="detail-page-head">
      <div><p className="eyebrow">YOUR DAY, FULLY DECODED</p><h1>{city}<span>, {country}</span></h1><p>{loading ? "Fetching the latest forecast…" : `${label(selected.date)} · ${selected.condition}`}</p></div>
      <div className="model-badge"><span>◉</span><div><b>Best-match model</b><small>Dedicated forecast view</small></div></div>
    </section>
    {(week.length > 0 || loading) && <nav className="week-dock detail-week-dock" aria-label="Choose another forecast day"><div className="week-dock-label"><span>7 DAY</span><small>Today + selected</small></div><div className="week-dock-days">{week.length > 0 ? week.map((day, index) => <button key={day.date} className={day.date === selected.date ? "is-selected" : ""} onMouseEnter={() => prefetchDay(day)} onFocus={() => prefetchDay(day)} onClick={() => openDay(day)}><span>{index === 0 ? "Today" : shortDay(day.date)}</span><b>{day.emoji}</b><small>{day.high}°</small></button>) : Array.from({ length: 7 }, (_, index) => <button key={`loading-day-${index}`} className="is-loading-day" disabled aria-label="Loading forecast day"><span>—</span><b>🌤️</b><small>—</small></button>)}</div><a href="/">New search ↗</a></nav>}
    <section className={`forecast-grid detail-forecast-grid ${loading ? "is-loading" : ""}`}>
      <article className="temperature-card"><div className={`weather-orb weather-animation animation-${animationKind(selected.condition)}`}><span>{selected.emoji}</span><i className="weather-particle particle-one" /><i className="weather-particle particle-two" /><i className="weather-particle particle-three" /></div><p className="card-kicker">EXPECTED</p><div className="temperature-value">{selected.temperature}<sup>°C</sup></div><div className="temperature-meta"><span>Feels like <b>{selected.feelsLike}°</b></span><span>↑ {selected.high}° &nbsp; ↓ {selected.low}°</span></div><div className="temperature-rule" /><p>{selected.condition}. Everything needed for this day, right where you selected it.</p></article>
      <article className="vibe-card"><div className="card-topline"><p className="card-kicker">THE VIBE METER</p><span>✦ SKY SENSE</span></div><div className="vibe-main"><div className="vibe-ring" style={{ "--score": `${mood.score}%` } as CSSProperties}><b>{mood.score}</b><small>/ 100</small></div><div><h3>{mood.title}</h3><p>{mood.note}</p></div></div><div className="vibe-bars"><span><i style={{ width: `${Math.max(12,100-selected.rain)}%` }} />Mood</span><span><i style={{ width: `${Math.max(12,100-selected.uv*7)}%` }} />Comfort</span><span><i style={{ width: `${Math.max(12,100-selected.wind*2)}%` }} />Hair-safe</span></div></article>
      <article className="humour-card"><span className="quote-mark">“</span><p className="card-kicker">HONESTLY, THOUGH</p><h3>{roast(selected)}</h3><div className="humour-footer"><span>— Your mildly concerned weather friend</span></div></article>
      <article className="details-card"><p className="card-kicker">THE NITTY GRITTY</p><div className="metrics"><div><span>☂</span><p>Rain chance<b>{selected.rain}%</b></p></div><div><span>●</span><p>Precipitation<b>{selected.precipitation} mm</b></p></div><div><span>≋</span><p>Wind<b>{selected.wind} km/h</b></p></div><div><span>↝</span><p>Wind gusts<b>{selected.gust} km/h</b></p></div><div><span>◒</span><p>Humidity<b>{selected.humidity}%</b></p></div><div><span>◌</span><p>UV index<b>{selected.uv} / 11</b></p></div><div><span>☀</span><p>Sunshine<b>{selected.sunshineHours} hrs</b></p></div><div><span>◐</span><p>Daylight<b>{selected.daylightHours} hrs</b></p></div></div><div className="sun-times"><span>↑ {selected.sunrise}<small>Sunrise</small></span><i /><span>↓ {selected.sunset}<small>Sunset</small></span></div></article>
    </section>

    <section className="hourly-card detail-l2-section" aria-labelledby="l2-hourly-title"><div className="feature-heading"><div><p className="card-kicker">HOURLY WEATHER STORY</p><h3 id="l2-hourly-title">How the day unfolds.</h3><p className="hourly-subtitle">A calm, two-hour rhythm from midnight to bedtime.</p></div><div className="best-time-pill"><span>✦ BEST OUTSIDE</span><b>{best.label}</b><small>{best.score >= 75 ? "Prime outdoor window" : "Best of today’s options"} · {best.score}/100</small></div></div>{hours.length ? <><div className="day-periods"><span>☾ Night</span><span>☀ Morning</span><span>◉ Afternoon</span><span>✦ Evening</span></div><div className="hourly-strip">{visibleHours.map((hour) => <article key={hour.time} className={`${best.label.startsWith(hour.time.slice(11,16)) ? "is-best" : ""} period-${period(hour.time)}`}><time>{hour.time.slice(11,16)}</time><span>{hour.emoji}</span><b>{hour.temperature}°</b><small>☂ {hour.rain}%</small><div className="rain-meter"><i style={{ width: `${Math.max(8,hour.rain)}%` }} /></div><em>{hour.wind} km/h</em></article>)}</div></> : <div className="empty-intel">Loading the hourly weather story…</div>}</section>

    <section className="trip-intelligence detail-l2-section"><article className="score-card"><p className="card-kicker">SMART TRIP SCORE</p><h3>One forecast, five decisions.</h3><div className="score-list">{tripScores.map((score) => <div key={score.label}><span>{score.icon} {score.label}</span><i><b style={{ width: `${score.value}%` }} /></i><strong>{score.value}</strong></div>)}</div></article><article className="alerts-card"><p className="card-kicker">WEATHER ALERTS</p><h3>{alerts.length ? `${alerts.length} thing${alerts.length > 1 ? "s" : ""} to watch` : "No drama detected."}</h3><div className="alert-list">{alerts.length ? alerts.map((alert) => <div className={alert.level} key={alert.title}><span>{alert.icon}</span><p><b>{alert.title}</b>{alert.note}</p></div>) : <div className="safe"><span>✓</span><p><b>All clear</b>No severe signals in this forecast window.</p></div>}</div></article></section>

    <section className="intelligence-grid detail-l2-section"><article className="health-card intel-card"><div className="intel-icon">🫁</div><p className="card-kicker">AIR + HEALTH</p><h3>{health.aqi ?? "—"}<small>US AQI · {health.aqi == null ? "Unavailable" : health.aqi <= 50 ? "Good" : health.aqi <= 100 ? "Moderate" : "Caution"}</small></h3><div className="health-stats"><span>PM2.5<b>{health.pm25 ?? "—"}</b></span><span>PM10<b>{health.pm10 ?? "—"}</b></span><span>Pollen<b>{health.pollen == null ? "N/A" : health.pollen.toFixed(1)}</b></span></div><p>{health.aqi != null && health.aqi <= 100 ? "Normal outdoor plans are generally fine." : "Sensitive travellers should keep protection handy."}</p></article><article className="history-card intel-card"><div className="intel-icon">🕰</div><p className="card-kicker">HISTORICAL REALITY CHECK</p><h3>Same date, last year</h3>{history ? <><div className="history-comparison"><span>Then<b>{history.high}° / {history.low}°</b><small>{history.rain} mm rain</small></span><i>→</i><span>Forecast<b>{selected.high}° / {selected.low}°</b><small>{selected.precipitation} mm rain</small></span></div><p>{Math.abs(selected.high-history.high)}° difference from last year.</p></> : <p>Historical comparison is loading.</p>}</article><article className="voice-card intel-card"><div className="intel-icon">🎙</div><p className="card-kicker">VOICE BRIEFING</p><h3>Hear it. Then go.</h3><p>Listen to a concise briefing for this exact day.</p><div className="voice-actions"><button type="button" onClick={speak}>▶ Listen</button></div></article><article className="share-card intel-card"><div className="intel-icon">✨</div><p className="card-kicker">SHAREABLE FORECAST</p><h3>Send the vibe.</h3><p>Share this selected city and date without taking a screenshot.</p><div className="voice-actions"><button type="button" onClick={() => void share()}>↗ Share forecast</button></div></article></section>

    <section className="radar-compare-grid detail-l2-section"><article className="radar-card"><div className="feature-heading"><div><p className="card-kicker">LIVE RAIN + AQI MAP</p><h3>See what’s around the region.</h3></div><a href="https://www.windy.com/" target="_blank" rel="noreferrer">Powered by Windy ↗</a></div>{radarUrl ? mapReady ? <><div className="radar-viewport interactive-radar"><iframe src={radarUrl} title={`Interactive rain radar for ${city}`} loading="lazy" /><div className={`map-aqi-badge ${health.aqi == null ? "loading" : health.aqi <= 50 ? "good" : health.aqi <= 100 ? "moderate" : "unhealthy"}`}><span>AQI NEAR {city.toUpperCase()}</span><b>{health.aqi ?? "···"}</b><small>{aqiName(health.aqi)}</small></div></div><p className="radar-caption"><span>●</span> Drag and zoom enabled · Timeline hidden</p></> : <div className="map-load-card"><span className="map-preview-icon">☁︎</span><b>Interactive map ready when you need it</b><small>Load it on demand to keep the forecast buttery smooth.</small><button type="button" onClick={() => setMapReady(true)}>Load interactive map</button></div> : <div className="empty-intel">Loading radar…</div>}</article><article className="compare-card"><p className="card-kicker">DESTINATION DUEL</p><h3>Where should we actually go?</h3><p>Compare up to three cities for {label(selected.date)}.</p><form onSubmit={(event) => void compare(event)}><input value={compareQuery} onChange={(event) => setCompareQuery(event.target.value)} /><button type="submit">Compare</button></form><div className="comparison-results">{compareResults.map((place,index) => <div key={place.city}><span className="rank">#{index+1}</span><span className="compare-icon">{place.emoji}</span><p><b>{place.city}</b><small>{place.high}° · ☂ {place.rain}%</small></p><strong>{place.score}<small>/100</small></strong></div>)}</div></article></section>

    {mapReady && <button type="button" className="map-exit-button" onClick={() => setMapReady(false)}>× Close interactive map</button>}
    <aside className="ad-slot detail-l2-section" aria-label="Advertisement" data-ad-slot="forecast-inline" data-ad-filled="false">
      <span>ADVERTISEMENT</span><div className="ad-content" />
    </aside>

    <section className="bottom-grid detail-l2-section"><article className="pack-card"><div><p className="eyebrow">THE “DON’T FORGET” LIST</p><h2>Pack smart.<br />Look <em>unbothered.</em></h2></div><div className="pack-list">{pack(selected).map((item,index) => <span key={item}><b>{String(index+1).padStart(2,"0")}</b>{item}</span>)}</div></article><article className="method-card"><span className="method-icon">✦</span><div><p className="card-kicker">NOT JUST A PRETTY FORECAST</p><h3>Best-match, location-aware predictions.</h3><p>Forecast intelligence is kept together on this L2 page so the selected city and day remain in context.</p></div></article></section>
  </main>;
}
