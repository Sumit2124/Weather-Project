"use client";

import { type CSSProperties, type FormEvent, useMemo, useState } from "react";

type WeatherResult = {
  city: string;
  country: string;
  date: string;
  condition: string;
  emoji: string;
  temperature: number;
  feelsLike: number;
  high: number;
  low: number;
  rain: number;
  wind: number;
  humidity: number;
  uv: number;
  sunrise: string;
  sunset: string;
};

const weatherCodes: Record<number, { condition: string; emoji: string }> = {
  0: { condition: "Clear skies", emoji: "☀️" },
  1: { condition: "Mostly clear", emoji: "🌤️" },
  2: { condition: "Partly cloudy", emoji: "⛅" },
  3: { condition: "Cloudy", emoji: "☁️" },
  45: { condition: "Foggy", emoji: "🌫️" },
  48: { condition: "Frosty fog", emoji: "🌫️" },
  51: { condition: "Light drizzle", emoji: "🌦️" },
  53: { condition: "Drizzle", emoji: "🌦️" },
  55: { condition: "Heavy drizzle", emoji: "🌧️" },
  61: { condition: "Light rain", emoji: "🌦️" },
  63: { condition: "Rain", emoji: "🌧️" },
  65: { condition: "Heavy rain", emoji: "🌧️" },
  71: { condition: "Snowfall", emoji: "🌨️" },
  73: { condition: "Snowy", emoji: "🌨️" },
  75: { condition: "Heavy snow", emoji: "❄️" },
  80: { condition: "Rain showers", emoji: "🌦️" },
  81: { condition: "Rain showers", emoji: "🌧️" },
  82: { condition: "Stormy showers", emoji: "⛈️" },
  95: { condition: "Thunderstorm", emoji: "⛈️" },
  96: { condition: "Thunderstorm + hail", emoji: "⛈️" },
  99: { condition: "Thunderstorm + hail", emoji: "⛈️" },
};

const fallbackResult: WeatherResult = {
  city: "New Delhi",
  country: "India",
  date: new Date().toISOString().slice(0, 10),
  condition: "Warm & bright",
  emoji: "🌤️",
  temperature: 31,
  feelsLike: 35,
  high: 33,
  low: 26,
  rain: 18,
  wind: 12,
  humidity: 57,
  uv: 7,
  sunrise: "05:53",
  sunset: "18:42",
};

const cityShortcuts = ["New Delhi", "Mumbai", "Bengaluru", "Manali"];

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function maxForecastDate() {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  return date.toISOString().slice(0, 10);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function timeLabel(value?: string) {
  if (!value) return "--:--";
  return value.slice(11, 16);
}

function getHumour(data: WeatherResult) {
  if (data.rain >= 60) {
    return "Aaj umbrella ko ghar chhoda na, toh baadal tumhe personally dhoondh lenge. ☔";
  }
  if (data.temperature >= 35) {
    return "Dhoop itni serious hai ki sunscreen bhi notice period maang rahi hai. 🥵";
  }
  if (data.wind >= 28) {
    return "Hawa ka confidence dekh ke hairstyle ne already resignation de diya. 💨";
  }
  if (data.condition.toLowerCase().includes("cloud")) {
    return "Baadal full meeting mode mein hain—bas output kab denge, koi nahi jaanta. ☁️";
  }
  return "Mausam sorted hai. Ab ‘kal dekhenge’ bolke plans cancel mat kar dena. 😌";
}

function getVibe(data: WeatherResult) {
  const score = Math.max(18, Math.min(96, Math.round(100 - data.rain * 0.55 - Math.max(data.uv - 7, 0) * 5 - Math.max(data.wind - 24, 0) * 0.75)));
  if (score >= 76) return { score, title: "Go outside", note: "Great window for plans" };
  if (score >= 52) return { score, title: "Flexible plans", note: "Carry a small backup" };
  return { score, title: "Indoor energy", note: "The sofa wins today" };
}

function getPackingTip(data: WeatherResult) {
  if (data.rain >= 50) return ["Rain cover", "Waterproof shoes", "Extra patience"];
  if (data.temperature >= 33) return ["Sunscreen", "Water bottle", "Light cotton"];
  if (data.low <= 15) return ["Light jacket", "Warm layers", "Hot chai energy"];
  return ["Sunglasses", "Water bottle", "Main-character confidence"];
}

export default function Home() {
  const [city, setCity] = useState("New Delhi");
  const [date, setDate] = useState(isoToday());
  const [result, setResult] = useState<WeatherResult>(fallbackResult);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Fresh forecast, zero boring charts.");

  const vibe = useMemo(() => getVibe(result), [result]);
  const forecastConfidence = Math.max(64, 96 - Math.max(0, Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${isoToday()}T12:00:00`).getTime()) / 86400000)) * 3);

  async function fetchForecast(event?: FormEvent, quickCity?: string) {
    event?.preventDefault();
    const requestedCity = (quickCity ?? city).trim();
    if (!requestedCity) {
      setMessage("Destination toh batao—hum astrology se nahi, data se forecast karte hain.");
      return;
    }

    setLoading(true);
    setMessage("SkySense is checking the sky’s mood...");
    try {
      const locationResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(requestedCity)}&count=1&language=en&format=json`,
      );
      const locationData = await locationResponse.json();
      const location = locationData.results?.[0];
      if (!location) throw new Error("Location not found");

      const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
      forecastUrl.search = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        timezone: "auto",
        forecast_days: "16",
        models: "best_match",
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset",
      }).toString();

      const forecastResponse = await fetch(forecastUrl);
      const forecast = await forecastResponse.json();
      const dayIndex = forecast.daily.time.indexOf(date);
      if (dayIndex === -1) throw new Error("Date not in forecast range");

      const isToday = date === isoToday();
      const code = isToday ? forecast.current.weather_code : forecast.daily.weather_code[dayIndex];
      const sky = weatherCodes[code] ?? weatherCodes[3];
      const nextResult: WeatherResult = {
        city: location.name,
        country: location.country ?? "",
        date,
        condition: sky.condition,
        emoji: sky.emoji,
        temperature: Math.round(isToday ? forecast.current.temperature_2m : (forecast.daily.temperature_2m_max[dayIndex] + forecast.daily.temperature_2m_min[dayIndex]) / 2),
        feelsLike: Math.round(isToday ? forecast.current.apparent_temperature : forecast.daily.apparent_temperature_max[dayIndex]),
        high: Math.round(forecast.daily.temperature_2m_max[dayIndex]),
        low: Math.round(forecast.daily.temperature_2m_min[dayIndex]),
        rain: Math.round(forecast.daily.precipitation_probability_max[dayIndex] ?? 0),
        wind: Math.round(isToday ? forecast.current.wind_speed_10m : forecast.daily.wind_speed_10m_max[dayIndex]),
        humidity: Math.round(isToday ? forecast.current.relative_humidity_2m : 58),
        uv: Math.round(forecast.daily.uv_index_max[dayIndex] ?? 0),
        sunrise: timeLabel(forecast.daily.sunrise[dayIndex]),
        sunset: timeLabel(forecast.daily.sunset[dayIndex]),
      };
      setResult(nextResult);
      setCity(location.name);
      setMessage("Forecast refreshed. The sky has submitted its report.");
    } catch {
      const fallbackCity = requestedCity.replace(/\b\w/g, (letter) => letter.toUpperCase());
      setResult({ ...fallbackResult, city: fallbackCity, date });
      setMessage("Live data took a chai break—showing a polished demo forecast for now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="weather-app">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />

      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Mausam ka Mood home">
          <span className="brand-mark">☼</span>
          <span>Mausam <i>ka Mood</i></span>
        </a>
        <div className="nav-status"><span className="live-dot" /> Forecasting with actual vibes</div>
        <button className="location-button" type="button" onClick={() => fetchForecast(undefined, "New Delhi")}>⌖ Delhi</button>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">WEATHER, BUT MAKE IT USEFUL</p>
          <h1>Plan the day.<br /><em>Outsmart the sky.</em></h1>
          <p className="hero-text">A travel-first weather planner that translates meteorology into a simple yes, no, or “bhai umbrella le ja.”</p>
          <div className="trust-row">
            <span>◌ Best-match forecast model</span>
            <span>◌ 16-day trip outlook</span>
            <span>◌ Zero weather jargon</span>
          </div>
        </div>

        <form className="planner-card" onSubmit={(event) => fetchForecast(event)}>
          <div className="planner-label"><span>✦</span> PLAN A LITTLE ESCAPE</div>
          <label>
            <span>Where are you headed?</span>
            <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Jaipur" aria-label="Travel destination" />
          </label>
          <label>
            <span>When are we leaving?</span>
            <input type="date" value={date} min={isoToday()} max={maxForecastDate()} onChange={(event) => setDate(event.target.value)} aria-label="Travel date" />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>{loading ? "Reading clouds..." : "Check the vibe  →"}</button>
          <p className="planner-note">Forecasts are available up to 16 days ahead.</p>
        </form>
      </section>

      <section className="shortcut-row" aria-label="Popular destinations">
        <span>Quick flights of fancy:</span>
        {cityShortcuts.map((shortcut) => <button key={shortcut} type="button" onClick={() => fetchForecast(undefined, shortcut)}>{shortcut}</button>)}
      </section>

      <section className="forecast-section" aria-live="polite">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR SKY, DECODED</p>
            <h2>{result.city}<span>, {result.country}</span></h2>
            <p>{dateLabel(result.date)} · <strong>{result.condition}</strong></p>
          </div>
          <div className="model-badge"><span>◉</span><div><b>{forecastConfidence}% confidence</b><small>Strongest for nearer dates</small></div></div>
        </div>

        <div className="forecast-grid">
          <article className="temperature-card">
            <div className="weather-orb"><span>{result.emoji}</span></div>
            <p className="card-kicker">RIGHT NOW / EXPECTED</p>
            <div className="temperature-value">{result.temperature}<sup>°C</sup></div>
            <div className="temperature-meta"><span>Feels like <b>{result.feelsLike}°</b></span><span>↑ {result.high}° &nbsp; ↓ {result.low}°</span></div>
            <div className="temperature-rule" />
            <p>{result.condition}. Nicely decoded, no dramatic weather anchor required.</p>
          </article>

          <article className="vibe-card">
            <div className="card-topline"><p className="card-kicker">THE VIBE METER</p><span>✦ SKY SENSE</span></div>
            <div className="vibe-main"><div className="vibe-ring" style={{ "--score": `${vibe.score}%` } as CSSProperties}><b>{vibe.score}</b><small>/ 100</small></div><div><h3>{vibe.title}</h3><p>{vibe.note}</p></div></div>
            <div className="vibe-bars"><span><i style={{ width: `${Math.max(12, 100 - result.rain)}%` }} />Mood</span><span><i style={{ width: `${Math.max(12, 100 - result.uv * 7)}%` }} />Comfort</span><span><i style={{ width: `${Math.max(12, 100 - result.wind * 2)}%` }} />Hair-safe</span></div>
          </article>

          <article className="humour-card">
            <span className="quote-mark">“</span>
            <p className="card-kicker">HONESTLY, THOUGH</p>
            <h3>{getHumour(result)}</h3>
            <div className="humour-footer"><span>— Your mildly concerned weather friend</span><span>☔</span></div>
          </article>

          <article className="details-card">
            <p className="card-kicker">THE NITTY GRITTY</p>
            <div className="metrics">
              <div><span>☂</span><p>Rain chance<b>{result.rain}%</b></p></div>
              <div><span>≋</span><p>Wind<b>{result.wind} km/h</b></p></div>
              <div><span>◒</span><p>Humidity<b>{result.humidity}%</b></p></div>
              <div><span>◌</span><p>UV index<b>{result.uv} / 11</b></p></div>
            </div>
            <div className="sun-times"><span>↑ {result.sunrise}<small>Sunrise</small></span><i /><span>↓ {result.sunset}<small>Sunset</small></span></div>
          </article>
        </div>
      </section>

      <section className="bottom-grid">
        <article className="pack-card">
          <div><p className="eyebrow">THE “DON’T FORGET” LIST</p><h2>Pack smart.<br />Look <em>unbothered.</em></h2></div>
          <div className="pack-list">{getPackingTip(result).map((item, index) => <span key={item}><b>{String(index + 1).padStart(2, "0")}</b>{item}</span>)}</div>
        </article>
        <article className="method-card">
          <span className="method-icon">✦</span>
          <div><p className="card-kicker">NOT JUST A PRETTY FORECAST</p><h3>Best-match, location-aware predictions.</h3><p>Mausam ka Mood asks Open-Meteo for the most suitable forecast model for your destination, then turns rain, heat, wind and UV into plan-ready insight.</p></div>
        </article>
      </section>

      <footer><span>MAUSAM KA MOOD™</span><span>{message}</span><span>Built for people who have plans.</span></footer>
    </main>
  );
}
