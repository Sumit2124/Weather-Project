"use client";

import { type CSSProperties, type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

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
  gust: number;
  precipitation: number;
  humidity: number;
  uv: number;
  sunshineHours: number;
  daylightHours: number;
  sunrise: string;
  sunset: string;
};

type DailyForecast = {
  date: string;
  condition: string;
  emoji: string;
  high: number;
  low: number;
  feelsLike: number;
  rain: number;
  wind: number;
  gust: number;
  precipitation: number;
  uv: number;
  sunshineHours: number;
  daylightHours: number;
  sunrise: string;
  sunset: string;
};

type CityOption = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  country_code?: string;
  feature_code?: string;
  population?: number;
};

type HourlyForecast = {
  time: string;
  temperature: number;
  feelsLike: number;
  rain: number;
  wind: number;
  humidity: number;
  visibility: number;
  uv: number;
  condition: string;
  emoji: string;
};

type HealthData = {
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
  pollen: number | null;
};

type HistoricalData = {
  high: number;
  low: number;
  rain: number;
};

type ComparisonResult = {
  city: string;
  country: string;
  high: number;
  low: number;
  rain: number;
  condition: string;
  emoji: string;
  score: number;
};

type HumourMode = "mild" | "savage" | "family";

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

type WeatherTheme = "sunrise" | "sunset" | "rain" | "thunder" | "hail" | "wind" | "snow";

const weatherThemes: { id: WeatherTheme; label: string; icon: string }[] = [
  { id: "sunrise", label: "Sunny", icon: "🌅" },
  { id: "rain", label: "Rain", icon: "🌧️" },
  { id: "wind", label: "Wind", icon: "💨" },
  { id: "snow", label: "Snow", icon: "❄️" },
  { id: "sunset", label: "Sunset", icon: "🌇" },
  { id: "thunder", label: "Thunder", icon: "⛈️" },
  { id: "hail", label: "Hail", icon: "🧊" },
];

const themeGifs: Record<WeatherTheme, string> = {
  sunrise: "https://media.giphy.com/media/yOwsbccYUiF5zbZKji/giphy.gif",
  sunset: "https://media.giphy.com/media/yOwsbccYUiF5zbZKji/giphy.gif",
  rain: "https://media.giphy.com/media/3ov9jCEFMBtCy54q6Q/giphy.gif",
  thunder: "https://media.giphy.com/media/3ov9jCEFMBtCy54q6Q/giphy.gif",
  hail: "https://media.giphy.com/media/3ov9jCEFMBtCy54q6Q/giphy.gif",
  wind: "https://media.giphy.com/media/tMK6FYdSgjm1zcP7yx/giphy.gif",
  snow: "https://media.giphy.com/media/qJVrgO9PfKNbYDM18k/giphy.gif",
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
  gust: 21,
  precipitation: 0.4,
  humidity: 57,
  uv: 7,
  sunshineHours: 8.6,
  daylightHours: 12.8,
  sunrise: "05:53",
  sunset: "18:42",
};

function makeFallbackWeek(baseDate = isoToday()): DailyForecast[] {
  const patterns = [
    { code: 1, high: 33, low: 26, rain: 18, wind: 12 },
    { code: 2, high: 32, low: 25, rain: 28, wind: 14 },
    { code: 61, high: 30, low: 24, rain: 62, wind: 18 },
    { code: 3, high: 31, low: 24, rain: 36, wind: 15 },
    { code: 0, high: 34, low: 26, rain: 8, wind: 10 },
    { code: 2, high: 33, low: 25, rain: 22, wind: 13 },
    { code: 80, high: 29, low: 23, rain: 58, wind: 20 },
  ];
  const start = new Date(`${baseDate}T12:00:00`);
  return patterns.map((pattern, index) => {
    const nextDate = new Date(start);
    nextDate.setDate(start.getDate() + index);
    const sky = weatherCodes[pattern.code] ?? weatherCodes[3];
    return {
      date: nextDate.toISOString().slice(0, 10),
      condition: sky.condition,
      emoji: sky.emoji,
      high: pattern.high,
      low: pattern.low,
      feelsLike: pattern.high + 2,
      rain: pattern.rain,
      wind: pattern.wind,
      gust: pattern.wind + 9,
      precipitation: Number((pattern.rain / 22).toFixed(1)),
      uv: pattern.code === 0 ? 8 : 5,
      sunshineHours: pattern.code === 0 ? 10.2 : pattern.code >= 51 ? 3.4 : 6.8,
      daylightHours: 12.8,
      sunrise: "05:53",
      sunset: "18:42",
    };
  });
}

const cityShortcuts = ["New Delhi", "Mumbai", "Bengaluru", "Manali"];
const footerSlangs = [
  "Mausam ka mood: umbrella le jao, overconfidence ghar chhod do. ☔",
  "Aaj clouds ka attitude zyada hai, plans thode flexible rakho. 😏",
  "Forecast bol raha hai ‘niklo’; traffic bol raha hai ‘soch lo’. 🚗",
  "Dhoop free hai, sunscreen complimentary nahi. ☀️",
  "Barish ka invitation aa gaya—chai compulsory hai. ☕",
  "Hawa itni tez hai ki hairstyle ne work-from-home choose kar liya. 💨",
  "Weather accurate hai; tumhara ‘bas paanch minute’ abhi bhi doubtful hai. 😄",
  "Aasmaan dramatic hai, par tum umbrella ke saath protagonist ho. 🌦️",
];

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

function weekdayLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(new Date(`${value}T12:00:00`));
}

function normalizedPlaceName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function rankCityResults(results: CityOption[], query: string) {
  const normalizedQuery = normalizedPlaceName(query);
  const score = (place: CityOption) => {
    const normalizedName = normalizedPlaceName(place.name);
    const exactScore = normalizedName === normalizedQuery ? 20000 : normalizedName.startsWith(normalizedQuery) ? 6000 : 0;
    const featureScore = place.feature_code === "PPLC" ? 9000 : place.feature_code === "PPLA" ? 5200 : place.feature_code === "PPLA2" ? 2600 : 0;
    const populationScore = place.population ? Math.min(7000, Math.log10(place.population + 1) * 1050) : 0;
    return exactScore + featureScore + populationScore;
  };

  const ranked = [...results].sort((first, second) => score(second) - score(first));
  const majorExact = ranked.find((place) =>
    normalizedPlaceName(place.name) === normalizedQuery
    && ((place.population ?? 0) >= 50000 || place.feature_code === "PPLC" || place.feature_code === "PPLA"),
  );

  return ranked.filter((place) => {
    if (!majorExact || place.id === majorExact.id) return true;
    const sameExactName = normalizedPlaceName(place.name) === normalizedQuery;
    const isTinyNamesake = (place.population ?? 0) < 10000;
    const isMajorAdministrativePlace = place.feature_code === "PPLC" || place.feature_code === "PPLA";
    return !(sameExactName && isTinyNamesake && !isMajorAdministrativePlace);
  });
}

function timeLabel(value?: string) {
  if (!value) return "--:--";
  return value.slice(11, 16);
}

const weatherHumour = {
  rain: [
    "Aaj umbrella ko ghar chhoda na, toh baadal tumhe personally dhoondh lenge. ☔",
    "Rain ka probability high hai. Tumhare ‘bas 5 minute mein pahunch raha hoon’ se bhi zyada. 🌧️",
    "Aaj roads swimming pool ban sakti hain—membership bilkul free hai. 🏊",
    "Baadal ne group project finally submit kar diya: unlimited paani. 💦",
    "White shoes pehen lo… agar character development chahiye toh. 👟",
    "Auto wale bhaiya ka surge pricing arc shuru hone wala hai. 🛺",
    "Pakode ka weather hai; productivity ko kal dekh lenge. ☕",
    "Baarish romantic tab tak hai jab tak laptop bag waterproof hai. 💻",
  ],
  hot: [
    "Dhoop itni serious hai ki sunscreen bhi notice period maang rahi hai. 🥵",
    "Aaj AC remote ghar ka asli power centre hai. Respect the throne. 👑",
    "Garmi ka level: chai bhi bol rahi hai ‘aaj rehne dete hain’. ☀️",
    "Sun ne brightness 100% pe karke remote chhupa diya hai. 🔆",
    "Aaj bahar nikle toh SPF lagao, optimism nahi. 😎",
    "Temperature dekh ke fridge ne emotional support offer kiya hai. 🧊",
    "Garmi itni hai, shadow bhi keh rahi hai ‘main WFH karungi’. 🌡️",
    "Hydrate karo. Soft drink ko paani samajhne ki galti mat karna. 🚰",
  ],
  wind: [
    "Hawa ka confidence dekh ke hairstyle ne already resignation de diya. 💨",
    "Aaj cap pehno toh uska return ticket bhi book kar dena. 🧢",
    "Wind itni ambitious hai, tumhari umbrella ko drone bana degi. 🪁",
    "Hair styling cancel. Nature ne apna salon khol rakha hai. 🌬️",
    "Hawa bol rahi hai: main aaun? Waise answer matter nahi karta. 🍃",
    "Loose papers sambhaal lo—warna neighbourhood newsletter ban jayenge. 📄",
  ],
  cloudy: [
    "Baadal full meeting mode mein hain—bas output kab denge, koi nahi jaanta. ☁️",
    "Sky ne aaj grey filter lagaya hai. Very corporate, very mysterious. 🩶",
    "Baadal aaye hain bas attendance lagane; kaam karenge ya nahi, suspense hai. 🌥️",
    "Sun ka ‘last seen’ off hai, par tension nahi—ghosting temporary hai. 👻",
    "Lighting free ka softbox hai. Selfie department ko inform kar do. 📸",
    "Aaj aasman ka mood bhi Monday jaisa hai—even if it isn’t Monday. 😶",
  ],
  cold: [
    "Jacket le jao. ‘Mujhe thand nahi lagti’ waale sabse pehle kaanpte hain. 🧥",
    "Weather cuddle-friendly hai, availability tum khud check kar lena. ❄️",
    "Aaj razai chhodna personal growth ke category mein aayega. 🛌",
    "Thand ne OTP nahi maanga, seedha body mein login kar liya. 🥶",
    "Chai optional nahi hai. It is now critical infrastructure. ☕",
    "Cold hands, warm heart—haan haan, gloves phir bhi le jao. 🧤",
  ],
  pleasant: [
    "Mausam sorted hai. Ab ‘kal dekhenge’ bolke plans cancel mat kar dena. 😌",
    "Weather ne green signal de diya. Ab dost cancel karein toh unki problem. ✅",
    "Aaj ka mausam main-character walk deserve karta hai. Headphones le jaana. 🎧",
    "Nature ne rare bug-free release ship kiya hai. Enjoy before the next patch. 🌿",
    "Perfect weather mil gaya. Screenshot le lo, proof kaam aayega. 📱",
    "Aaj ghar pe rehna allowed hai, logical bilkul nahi. 🚶",
    "Sky is serving. Tum bas late mat hona, as usual. ✨",
    "Weather: flawless. Planning skills: ab tum dekh lo. 😏",
  ],
};

function getHumour(data: WeatherResult, index: number) {
  let category: keyof typeof weatherHumour = "pleasant";
  if (data.rain >= 50) category = "rain";
  else if (data.temperature >= 34) category = "hot";
  else if (data.wind >= 26) category = "wind";
  else if (data.low <= 15) category = "cold";
  else if (data.condition.toLowerCase().includes("cloud")) category = "cloudy";
  const quotes = weatherHumour[category];
  return quotes[index % quotes.length];
}

function getVibe(data: WeatherResult) {
  const score = Math.max(18, Math.min(96, Math.round(100 - data.rain * 0.55 - Math.max(data.uv - 7, 0) * 5 - Math.max(data.wind - 24, 0) * 0.75)));
  if (score >= 76) return { score, title: "Go outside", note: "Great window for plans" };
  if (score >= 52) return { score, title: "Flexible plans", note: "Carry a small backup" };
  return { score, title: "Indoor energy", note: "The sofa wins today" };
}

function getPackingTip(data: WeatherResult) {
  const items = ["Water bottle", "Power bank", "Comfy walking shoes"];
  if (data.rain >= 35) items.push("Compact umbrella", "Rain cover");
  if (data.temperature >= 30 || data.uv >= 6) items.push("SPF 50 sunscreen", "Sunglasses", "Light cotton");
  if (data.low <= 18) items.push("Light jacket", "Warm layer");
  if (data.wind >= 24) items.push("Windbreaker", "Hair tie / cap");
  if (items.length < 7) items.push("Tiny first-aid kit", "Main-character confidence");
  return items.slice(0, 9);
}

const familyHumour = [
  "Mausam ready hai—bas bottle, smile aur backup plan saath rakhna. 🌈",
  "Aaj sky ka homework complete hai. Ab outing ka homework tumhara. 🎒",
  "Weather friendly hai, par mummy ki ‘jacket le jao’ advice evergreen hai. 🧥",
  "Clouds aaye toh hello bolna; umbrella ho toh aur bhi politely. ☁️",
  "Forecast says adventure. Snacks department says double-check the bag. 🍪",
  "Sun ho ya rain, family photo mein sabko smile karna hi padega. 📸",
];

const savageHumour = [
  "Forecast accurate hai; tumhara ‘main time pe aaunga’ wala model abhi beta mein hai. 😏",
  "Weather ka plan clear hai. Group chat ka plan ab bhi archaeological mystery hai. 🗿",
  "Umbrella le jao—confidence waterproof nahi hota, dost. ☔",
  "Sky ne update de diya. Ab tum late hue toh baadal ko blame mat karna. ⏰",
  "Temperature manageable hai; tumhari overpacking habit ka forecast severe hai. 🧳",
  "Nature sorted. Tum bas location pin galat mat bhejna, legend. 📍",
];

function getPersonalizedHumour(data: WeatherResult, index: number, mode: HumourMode) {
  if (mode === "family") return familyHumour[index % familyHumour.length];
  if (mode === "savage") return savageHumour[index % savageHumour.length];
  return getHumour(data, index);
}

function hourValue(value: string) {
  return Number(value.slice(11, 13));
}

function hourScore(hour: HourlyForecast) {
  const temperaturePenalty = Math.abs(hour.temperature - 24) * 2.1;
  return Math.max(5, Math.min(99, Math.round(100 - hour.rain * .65 - temperaturePenalty - Math.max(0, hour.wind - 18) - Math.max(0, hour.uv - 6) * 3)));
}

function getBestTime(hours: HourlyForecast[]) {
  const daytime = hours.filter((hour) => hourValue(hour.time) >= 6 && hourValue(hour.time) <= 21);
  if (!daytime.length) return { label: "Daylight window", score: 0, note: "Hourly data is waking up." };
  let bestIndex = 0;
  let bestScore = -1;
  daytime.forEach((hour, index) => {
    const next = daytime[index + 1] ?? hour;
    const score = Math.round((hourScore(hour) + hourScore(next)) / 2);
    if (score > bestScore) { bestScore = score; bestIndex = index; }
  });
  const start = timeLabel(daytime[bestIndex].time);
  const nextHour = (hourValue(daytime[bestIndex].time) + 1) % 24;
  const end = `${String(nextHour).padStart(2, "0")}:00`;
  return { label: `${start}–${end}`, score: bestScore, note: bestScore >= 75 ? "Prime outdoor window" : bestScore >= 50 ? "Best of today’s options" : "Keep a backup plan nearby" };
}

function hourPeriod(time: string) {
  const hour = hourValue(time);
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getTripScores(data: WeatherResult) {
  const base = getVibe(data).score;
  return [
    { label: "Overall trip", value: base, icon: "✦" },
    { label: "Outdoor plans", value: Math.max(10, Math.round(base - data.rain * .18)), icon: "🥾" },
    { label: "Photography", value: Math.max(12, Math.min(98, Math.round(88 - data.rain * .28 - Math.max(0, data.uv - 7) * 4))), icon: "📸" },
    { label: "Easy driving", value: Math.max(8, Math.round(96 - data.rain * .55 - Math.max(0, data.wind - 20))), icon: "🚗" },
    { label: "Hair safety", value: Math.max(5, Math.round(100 - data.wind * 2.2 - data.rain * .2)), icon: "💇" },
  ];
}

function getAlerts(data: WeatherResult, hours: HourlyForecast[]) {
  const alerts: { level: string; icon: string; title: string; note: string }[] = [];
  if (data.rain >= 70 || data.condition.toLowerCase().includes("thunder")) alerts.push({ level: "danger", icon: "⛈", title: "Storm watch", note: "Heavy rain or thunder may disrupt outdoor plans." });
  if (data.gust >= 45) alerts.push({ level: "warn", icon: "💨", title: "Strong gusts", note: `Gusts may reach ${data.gust} km/h. Secure loose items.` });
  if (data.uv >= 8) alerts.push({ level: "warn", icon: "☀", title: "Very high UV", note: "Shade and SPF are strongly recommended around noon." });
  if (data.high >= 38) alerts.push({ level: "danger", icon: "🌡", title: "Heat stress", note: "Avoid strenuous plans during the hottest hours." });
  if (hours.some((hour) => hour.visibility < 3000)) alerts.push({ level: "warn", icon: "🌫", title: "Low visibility", note: "Allow extra travel time, especially while driving." });
  return alerts;
}

function aqiLabel(aqi: number | null) {
  if (aqi == null) return { label: "Unavailable", color: "#7b8090" };
  if (aqi <= 50) return { label: "Good", color: "#26875c" };
  if (aqi <= 100) return { label: "Moderate", color: "#b07b14" };
  if (aqi <= 150) return { label: "Sensitive groups: caution", color: "#c4672e" };
  if (aqi <= 200) return { label: "Unhealthy", color: "#c13e3e" };
  return { label: "Very unhealthy", color: "#7d328d" };
}

function getWeatherTheme(data: WeatherResult): WeatherTheme {
  const condition = data.condition.toLowerCase();
  if (condition.includes("hail")) return "hail";
  if (condition.includes("snow") || condition.includes("frost")) return "snow";
  if (condition.includes("thunder") || condition.includes("storm")) return "thunder";
  if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("shower")) return "rain";
  if (data.wind >= 26) return "wind";
  return "sunrise";
}

export default function Home() {
  const hydrated = useSyncExternalStore(subscribeToHydration, getClientHydrationSnapshot, getServerHydrationSnapshot);
  const [city, setCity] = useState("New Delhi");
  const [date, setDate] = useState(isoToday());
  const [result, setResult] = useState<WeatherResult>(fallbackResult);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Fresh forecast, zero boring charts.");
  const [footerSlang, setFooterSlang] = useState(footerSlangs[0]);
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<CityOption | null>(null);
  const [searchingCities, setSearchingCities] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [humourIndex, setHumourIndex] = useState(0);
  const [requestState, setRequestState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [actionFeedback, setActionFeedback] = useState("Choose a place and we’ll decode the sky.");
  const [weeklyForecast, setWeeklyForecast] = useState<DailyForecast[]>(() => makeFallbackWeek());
  const [themeOverride, setThemeOverride] = useState<WeatherTheme | null>(null);
  const [cycleTheme, setCycleTheme] = useState<WeatherTheme>("sunrise");
  const [rotationPaused, setRotationPaused] = useState(false);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [healthData, setHealthData] = useState<HealthData>({ aqi: null, pm25: null, pm10: null, pollen: null });
  const [healthState, setHealthState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [comparisonQuery, setComparisonQuery] = useState("Mumbai, Bengaluru");
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [humourMode, setHumourMode] = useState<HumourMode>("mild");
  const [voiceStatus, setVoiceStatus] = useState("Voice briefing ready");
  const forecastRef = useRef<HTMLElement>(null);
  const initialForecastLoaded = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => setFooterSlang((current) => footerSlangs[(footerSlangs.indexOf(current) + 1) % footerSlangs.length]), 7000);
    return () => window.clearInterval(timer);
  }, []);

  const vibe = useMemo(() => getVibe(result), [result]);
  const bestTime = useMemo(() => getBestTime(hourlyForecast), [hourlyForecast]);
  const hourlyDisplay = useMemo(() => hourlyForecast.filter((hour, index) => index % 2 === 0 || bestTime.label.startsWith(timeLabel(hour.time))), [hourlyForecast, bestTime.label]);
  const tripScores = useMemo(() => getTripScores(result), [result]);
  const weatherAlerts = useMemo(() => getAlerts(result, hourlyForecast), [result, hourlyForecast]);
  const airQuality = useMemo(() => aqiLabel(healthData.aqi), [healthData.aqi]);
  const radarUrl = useMemo(() => selectedLocation ? `https://embed.windy.com/embed2.html?lat=${selectedLocation.latitude}&lon=${selectedLocation.longitude}&zoom=7&level=surface&overlay=radar&product=radar&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&detailLat=${selectedLocation.latitude}&detailLon=${selectedLocation.longitude}&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1&play=0` : "", [selectedLocation]);
  const activeTheme = themeOverride ?? cycleTheme;
  const displayTheme: WeatherTheme = hydrated ? activeTheme : "sunrise";
  const forecastConfidence = Math.max(64, 96 - Math.max(0, Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${isoToday()}T12:00:00`).getTime()) / 86400000)) * 3);

  useEffect(() => {
    if (rotationPaused) return;
    const timer = window.setInterval(() => {
      setThemeOverride(null);
      setCycleTheme((current) => {
        const currentIndex = weatherThemes.findIndex((theme) => theme.id === current);
        return weatherThemes[(currentIndex + 1) % weatherThemes.length].id;
      });
    }, 12000);
    return () => window.clearInterval(timer);
  }, [rotationPaused, themeOverride]);

  useEffect(() => {
    const query = city.trim();
    if (query.length < 3 || selectedLocation?.name === query) {
      setCitySuggestions([]);
      setSearchingCities(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchingCities(true);
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=12&language=en&format=json`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("City search failed");
        const data = await response.json();
        setCitySuggestions(rankCityResults(data.results ?? [], query).slice(0, 6));
        setActiveSuggestion(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setCitySuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSearchingCities(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [city, selectedLocation]);

  useEffect(() => {
    if (!hydrated || initialForecastLoaded.current) return;
    initialForecastLoaded.current = true;
    void fetchForecast(undefined, "New Delhi", undefined, false);
  }, [hydrated]);

  async function loadIntelligence(location: CityOption, selectedDate: string) {
    setHealthState("loading");
    const hourlyUrl = new URL("https://api.open-meteo.com/v1/forecast");
    hourlyUrl.search = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      timezone: "auto",
      forecast_days: "16",
      hourly: "temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,relative_humidity_2m,visibility,uv_index",
    }).toString();

    const airUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
    airUrl.search = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      timezone: "auto",
      current: "us_aqi,pm2_5,pm10,grass_pollen,alder_pollen,birch_pollen,mugwort_pollen,ragweed_pollen",
    }).toString();

    const previous = new Date(`${selectedDate}T12:00:00`);
    previous.setFullYear(previous.getFullYear() - 1);
    const previousDate = previous.toISOString().slice(0, 10);
    const historyUrl = new URL("https://archive-api.open-meteo.com/v1/archive");
    historyUrl.search = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      timezone: "auto",
      start_date: previousDate,
      end_date: previousDate,
      daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
    }).toString();

    const [hourlySettled, airSettled, historySettled] = await Promise.allSettled([
      fetch(hourlyUrl).then((response) => response.ok ? response.json() : Promise.reject()),
      fetch(airUrl).then((response) => response.ok ? response.json() : Promise.reject()),
      fetch(historyUrl).then((response) => response.ok ? response.json() : Promise.reject()),
    ]);

    if (hourlySettled.status === "fulfilled") {
      const data = hourlySettled.value;
      const rows: HourlyForecast[] = data.hourly.time.reduce((items: HourlyForecast[], value: string, index: number) => {
        if (!value.startsWith(selectedDate)) return items;
        const sky = weatherCodes[data.hourly.weather_code[index]] ?? weatherCodes[3];
        items.push({
          time: value,
          temperature: Math.round(data.hourly.temperature_2m[index]),
          feelsLike: Math.round(data.hourly.apparent_temperature[index]),
          rain: Math.round(data.hourly.precipitation_probability[index] ?? 0),
          wind: Math.round(data.hourly.wind_speed_10m[index] ?? 0),
          humidity: Math.round(data.hourly.relative_humidity_2m[index] ?? 0),
          visibility: Math.round(data.hourly.visibility[index] ?? 10000),
          uv: Number((data.hourly.uv_index[index] ?? 0).toFixed(1)),
          condition: sky.condition,
          emoji: sky.emoji,
        });
        return items;
      }, []);
      setHourlyForecast(rows);
    } else setHourlyForecast([]);

    if (airSettled.status === "fulfilled") {
      const current = airSettled.value.current ?? {};
      const pollenValues = [current.grass_pollen, current.alder_pollen, current.birch_pollen, current.mugwort_pollen, current.ragweed_pollen].filter((value) => typeof value === "number");
      setHealthData({
        aqi: current.us_aqi ?? null,
        pm25: current.pm2_5 ?? null,
        pm10: current.pm10 ?? null,
        pollen: pollenValues.length ? Math.max(...pollenValues) : null,
      });
      setHealthState("ready");
    } else {
      setHealthData({ aqi: null, pm25: null, pm10: null, pollen: null });
      setHealthState("unavailable");
    }

    if (historySettled.status === "fulfilled" && historySettled.value.daily?.time?.length) {
      setHistoricalData({
        high: Math.round(historySettled.value.daily.temperature_2m_max[0]),
        low: Math.round(historySettled.value.daily.temperature_2m_min[0]),
        rain: Number((historySettled.value.daily.precipitation_sum[0] ?? 0).toFixed(1)),
      });
    } else setHistoricalData(null);
  }

  function selectCity(option: CityOption) {
    setCity(option.name);
    setSelectedLocation(option);
    setCitySuggestions([]);
    setActiveSuggestion(-1);
    void fetchForecast(undefined, option.name, option);
  }

  function handleCityKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (!citySuggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) => Math.min(current + 1, citySuggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((current) => Math.max(current - 1, 0));
    } else if (event.key === "Escape") {
      setCitySuggestions([]);
      setActiveSuggestion(-1);
    } else if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      selectCity(citySuggestions[activeSuggestion]);
    }
  }

  function showForecastDay(day: DailyForecast, scrollToDetails = true) {
    setDate(day.date);
    setResult((current) => ({
      ...current,
      date: day.date,
      condition: day.condition,
      emoji: day.emoji,
      temperature: Math.round((day.high + day.low) / 2),
      feelsLike: day.feelsLike,
      high: day.high,
      low: day.low,
      rain: day.rain,
      wind: day.wind,
      gust: day.gust,
      precipitation: day.precipitation,
      uv: day.uv,
      sunshineHours: day.sunshineHours,
      daylightHours: day.daylightHours,
      sunrise: day.sunrise,
      sunset: day.sunset,
    }));
    setHumourIndex((current) => current + 1);
    setCycleTheme(getWeatherTheme({ ...result, condition: day.condition, wind: day.wind, low: day.low }));
    setThemeOverride(null);
    setRequestState("success");
    setActionFeedback(`${weekdayLabel(day.date)} selected — detailed forecast updated.`);
    if (selectedLocation) void loadIntelligence(selectedLocation, day.date);
    if (scrollToDetails) {
      window.setTimeout(() => forecastRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }

  function openForecastPage(day: DailyForecast) {
    const params = new URLSearchParams({ city: result.city, country: result.country, date: day.date });
    if (selectedLocation) {
      params.set("lat", String(selectedLocation.latitude));
      params.set("lon", String(selectedLocation.longitude));
    }
    window.location.assign(`/forecast?${params.toString()}`);
  }

  async function fetchForecast(event?: FormEvent, quickCity?: string, chosenLocation?: CityOption, scrollAfter = true) {
    event?.preventDefault();
    const requestedCity = (quickCity ?? city).trim();
    if (!requestedCity) {
      setMessage("Destination toh batao—hum astrology se nahi, data se forecast karte hain.");
      return;
    }

    setLoading(true);
    setRequestState("loading");
    setActionFeedback(`Checking the sky over ${requestedCity}…`);
    setMessage("SkySense is checking the sky’s mood...");
    try {
      let location: CityOption | undefined = chosenLocation;
      if (!location && selectedLocation?.name === requestedCity) location = selectedLocation;
      if (!location) {
        const locationResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(requestedCity)}&count=12&language=en&format=json`,
        );
        if (!locationResponse.ok) throw new Error("Location search failed");
        const locationData = await locationResponse.json();
        location = rankCityResults(locationData.results ?? [], requestedCity)[0];
      }
      if (!location) throw new Error("Location not found");

      const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
      forecastUrl.search = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        timezone: "auto",
        forecast_days: "16",
        models: "best_match",
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunshine_duration,daylight_duration,sunrise,sunset",
      }).toString();

      const forecastResponse = await fetch(forecastUrl);
      if (!forecastResponse.ok) throw new Error("Forecast unavailable");
      const forecast = await forecastResponse.json();
      const dayIndex = forecast.daily.time.indexOf(date);
      if (dayIndex === -1) throw new Error("Date not in forecast range");

      const isToday = date === isoToday();
      const code = isToday ? forecast.current.weather_code : forecast.daily.weather_code[dayIndex];
      const sky = weatherCodes[code] ?? weatherCodes[3];
      const weekStart = Math.min(dayIndex, Math.max(0, forecast.daily.time.length - 7));
      const week: DailyForecast[] = forecast.daily.time.slice(weekStart, weekStart + 7).map((forecastDate: string, offset: number) => {
        const index = weekStart + offset;
        const daySky = weatherCodes[forecast.daily.weather_code[index]] ?? weatherCodes[3];
        return {
          date: forecastDate,
          condition: daySky.condition,
          emoji: daySky.emoji,
          high: Math.round(forecast.daily.temperature_2m_max[index]),
          low: Math.round(forecast.daily.temperature_2m_min[index]),
          feelsLike: Math.round(forecast.daily.apparent_temperature_max[index]),
          rain: Math.round(forecast.daily.precipitation_probability_max[index] ?? 0),
          wind: Math.round(forecast.daily.wind_speed_10m_max[index] ?? 0),
          gust: Math.round(forecast.daily.wind_gusts_10m_max[index] ?? 0),
          precipitation: Number((forecast.daily.precipitation_sum[index] ?? 0).toFixed(1)),
          uv: Math.round(forecast.daily.uv_index_max[index] ?? 0),
          sunshineHours: Number(((forecast.daily.sunshine_duration[index] ?? 0) / 3600).toFixed(1)),
          daylightHours: Number(((forecast.daily.daylight_duration[index] ?? 0) / 3600).toFixed(1)),
          sunrise: timeLabel(forecast.daily.sunrise[index]),
          sunset: timeLabel(forecast.daily.sunset[index]),
        };
      });
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
        gust: Math.round(forecast.daily.wind_gusts_10m_max[dayIndex] ?? 0),
        precipitation: Number((forecast.daily.precipitation_sum[dayIndex] ?? 0).toFixed(1)),
        humidity: Math.round(isToday ? forecast.current.relative_humidity_2m : 58),
        uv: Math.round(forecast.daily.uv_index_max[dayIndex] ?? 0),
        sunshineHours: Number(((forecast.daily.sunshine_duration[dayIndex] ?? 0) / 3600).toFixed(1)),
        daylightHours: Number(((forecast.daily.daylight_duration[dayIndex] ?? 0) / 3600).toFixed(1)),
        sunrise: timeLabel(forecast.daily.sunrise[dayIndex]),
        sunset: timeLabel(forecast.daily.sunset[dayIndex]),
      };
      setResult(nextResult);
      setWeeklyForecast(week);
      setCycleTheme(getWeatherTheme(nextResult));
      setThemeOverride(null);
      setCity(location.name);
      setSelectedLocation(location);
      void loadIntelligence(location, date);
      setCitySuggestions([]);
      setHumourIndex((current) => current + 1);
      setRequestState("success");
      setActionFeedback(`${location.name} is ready — forecast refreshed!`);
      setMessage("Forecast refreshed. The sky has submitted its report.");
      if (scrollAfter) window.setTimeout(() => forecastRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch {
      const fallbackCity = requestedCity.replace(/\b\w/g, (letter) => letter.toUpperCase());
      setResult({ ...fallbackResult, city: fallbackCity, date });
      setWeeklyForecast(makeFallbackWeek(date));
      setCycleTheme(getWeatherTheme(fallbackResult));
      setThemeOverride(null);
      setHumourIndex((current) => current + 1);
      setRequestState("error");
      setHealthState("unavailable");
      setActionFeedback("Live weather paused — showing the demo vibe instead.");
      setMessage("Live data took a chai break—showing a polished demo forecast for now.");
      if (scrollAfter) window.setTimeout(() => forecastRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } finally {
      setLoading(false);
    }
  }

  async function compareDestinations(event: FormEvent) {
    event.preventDefault();
    const names = comparisonQuery.split(",").map((name) => name.trim()).filter(Boolean).slice(0, 3);
    if (!names.length) return;
    setComparisonLoading(true);
    try {
      const comparisons = await Promise.all(names.map(async (name): Promise<ComparisonResult> => {
        const geocodeResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=8&language=en&format=json`);
        const geocode = await geocodeResponse.json();
        const location = rankCityResults(geocode.results ?? [], name)[0];
        if (!location) throw new Error("City not found");
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.search = new URLSearchParams({
          latitude: String(location.latitude), longitude: String(location.longitude), timezone: "auto", forecast_days: "16",
          daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max",
        }).toString();
        const response = await fetch(url);
        const forecast = await response.json();
        const index = forecast.daily.time.indexOf(date);
        if (index < 0) throw new Error("Date unavailable");
        const rain = Math.round(forecast.daily.precipitation_probability_max[index] ?? 0);
        const high = Math.round(forecast.daily.temperature_2m_max[index]);
        const low = Math.round(forecast.daily.temperature_2m_min[index]);
        const wind = Math.round(forecast.daily.wind_speed_10m_max[index] ?? 0);
        const uv = Math.round(forecast.daily.uv_index_max[index] ?? 0);
        const sky = weatherCodes[forecast.daily.weather_code[index]] ?? weatherCodes[3];
        const sample: WeatherResult = { ...result, high, low, temperature: Math.round((high + low) / 2), rain, wind, uv, condition: sky.condition };
        return { city: location.name, country: location.country, high, low, rain, condition: sky.condition, emoji: sky.emoji, score: getVibe(sample).score };
      }));
      setComparisonResults(comparisons.sort((first, second) => second.score - first.score));
    } catch {
      setComparisonResults([]);
      setActionFeedback("One comparison city played hide-and-seek. Try another spelling.");
    } finally {
      setComparisonLoading(false);
    }
  }

  function forecastBriefing() {
    return `${result.city} on ${dateLabel(result.date)}: ${result.condition}, ${result.high} degree high and ${result.low} degree low. Rain chance is ${result.rain} percent. Best time to go out is ${bestTime.label}. ${getPersonalizedHumour(result, humourIndex, humourMode)}`;
  }

  function speakForecast() {
    if (!("speechSynthesis" in window)) { setVoiceStatus("Voice playback is not supported here."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(forecastBriefing());
    utterance.lang = "en-IN";
    utterance.rate = .96;
    utterance.onstart = () => setVoiceStatus("Speaking your weather briefing…");
    utterance.onend = () => setVoiceStatus("Briefing complete");
    window.speechSynthesis.speak(utterance);
  }

  function startVoiceSearch() {
    type Recognition = {
      lang: string; interimResults: boolean; start: () => void;
      onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
      onerror: () => void; onend: () => void;
    };
    const voiceWindow = window as typeof window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const RecognitionClass = voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
    if (!RecognitionClass) { setVoiceStatus("Voice search is not supported in this browser."); return; }
    const recognition = new RecognitionClass();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      const place = transcript.replace(/^(show|check|tell me|what is|what's)?\s*(the\s*)?(weather|forecast)\s*(in|for|at)?\s*/i, "").trim();
      setCity(place || transcript);
      setSelectedLocation(null);
      setVoiceStatus(`Heard “${place || transcript}” — press Check the vibe.`);
    };
    recognition.onerror = () => setVoiceStatus("Couldn’t hear that clearly. Try once more.");
    recognition.onend = () => setVoiceStatus((current) => current === "Listening…" ? "No speech detected. Try again." : current);
    setVoiceStatus("Listening…");
    recognition.start();
  }

  async function shareForecast() {
    const text = forecastBriefing();
    try {
      if (navigator.share) await navigator.share({ title: `Mausam ka Mood · ${result.city}`, text });
      else { await navigator.clipboard.writeText(text); setActionFeedback("Forecast copied — group chat weather minister unlocked."); }
    } catch { setActionFeedback("Sharing cancelled. The forecast is still right here."); }
  }

  function downloadWeatherCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 630;
    const context = canvas.getContext("2d");
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, "#fff0dd"); gradient.addColorStop(1, "#ded7ff");
    context.fillStyle = gradient; context.fillRect(0, 0, 1200, 630);
    context.fillStyle = "#51419a"; context.fillRect(70, 70, 1060, 490);
    context.fillStyle = "#ffd264"; context.beginPath(); context.arc(1000, 145, 120, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#ffffff"; context.font = "800 30px Arial"; context.fillText("MAUSAM KA MOOD", 120, 135);
    context.font = "800 66px Arial"; context.fillText(`${result.city}  ${result.emoji}`, 120, 235);
    context.font = "900 142px Arial"; context.fillText(`${result.temperature}°`, 112, 405);
    context.font = "700 34px Arial"; context.fillText(`${result.condition} · ${result.rain}% rain · ${result.wind} km/h wind`, 410, 355);
    context.font = "600 27px Arial"; context.fillStyle = "#ddd7ff"; context.fillText(`Best outside: ${bestTime.label}  ·  ${dateLabel(result.date)}`, 410, 410);
    context.font = "italic 25px Georgia"; context.fillStyle = "#ffd8c7"; context.fillText(getPersonalizedHumour(result, humourIndex, humourMode).slice(0, 73), 120, 505);
    const anchor = document.createElement("a");
    anchor.download = `mausam-ka-mood-${result.city.toLowerCase().replace(/\s+/g, "-")}.png`;
    anchor.href = canvas.toDataURL("image/png");
    anchor.click();
    setActionFeedback("Weather card downloaded — flex responsibly.");
  }

  return (
    <main className={`weather-app home-page app-theme-${displayTheme}`}>
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

        <div className="hero-sky-stage" aria-label={`Animated ${displayTheme} weather for ${result.city}`}>
          <div className="hero-weather-pill"><span>{result.emoji}</span><p><small>LIVE IN {result.city.toUpperCase()}</small><b>{result.temperature}°C</b><em>{result.condition}</em></p></div>
          <div className={`weather-scene scene-${displayTheme}`} aria-hidden="true">
            <div className="scene-sun"><i /></div>
            <div className="scene-cloud cloud-one" />
            <div className="scene-cloud cloud-two" />
            <img className="scene-gif" src={themeGifs[displayTheme]} alt="" />
            <div className="rain-layer">{Array.from({ length: 16 }, (_, index) => <i key={index} style={{ "--drop": index } as CSSProperties} />)}</div>
            <div className="hail-layer">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--hail": index } as CSSProperties} />)}</div>
            <div className="snow-layer">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--snow": index } as CSSProperties} />)}</div>
            <div className="lightning-layer"><i /><i /></div>
            <div className="wind-layer">{Array.from({ length: 6 }, (_, index) => <i key={index} style={{ "--gust": index } as CSSProperties} />)}</div>
          </div>
          <span className="scene-status"><i /> Scene changes automatically</span>
        </div>

        <form className="planner-card" onSubmit={(event) => fetchForecast(event)}>
          <div className="planner-label"><span>✦</span> PLAN A LITTLE ESCAPE</div>
          <label className="city-picker">
            <span>Where are you headed?</span>
            <div className="city-input-wrap">
              <input
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  setSelectedLocation(null);
                }}
                onKeyDown={handleCityKeys}
                onBlur={() => window.setTimeout(() => setCitySuggestions([]), 140)}
                placeholder="Search any city or town"
                aria-label="Travel destination"
                aria-autocomplete="list"
                aria-controls="city-suggestions"
                aria-expanded={citySuggestions.length > 0}
                role="combobox"
                autoComplete="off"
              />
              <span className={`city-search-indicator ${searchingCities ? "is-searching" : ""}`} aria-hidden="true">⌕</span>
            </div>
            {citySuggestions.length > 0 && (
              <ul className="city-suggestions" id="city-suggestions" role="listbox">
                {citySuggestions.map((option, index) => (
                  <li key={option.id} role="option" aria-selected={index === activeSuggestion}>
                    <button
                      className={index === activeSuggestion ? "is-active" : ""}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectCity(option)}
                    >
                      <span className="suggestion-pin">⌖</span>
                      <span><b>{option.name}{option.feature_code === "PPLC" && <em>Capital</em>}</b><small>{[option.admin1, option.country].filter(Boolean).join(", ")}</small></span>
                      <i>→</i>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </label>
          <label>
            <span>When are we leaving?</span>
            <input type="date" value={date} min={isoToday()} max={maxForecastDate()} onChange={(event) => setDate(event.target.value)} aria-label="Travel date" />
          </label>
          <button className={`primary-button ${loading ? "is-loading" : ""}`} type="submit" disabled={loading}>
            {loading ? <><span className="button-spinner" /> Checking {city}…</> : <>Check the vibe <span>→</span></>}
          </button>
          <div className={`action-feedback ${requestState}`} role="status" aria-live="polite">
            <span>{requestState === "loading" ? "◌" : requestState === "success" ? "✓" : requestState === "error" ? "!" : "✦"}</span>
            <p>{actionFeedback}</p>
          </div>
          <p className="planner-note">Forecasts are available up to 16 days ahead.</p>
        </form>
      </section>

      <section className="shortcut-row" aria-label="Popular destinations">
        <span>Quick flights of fancy:</span>
        {cityShortcuts.map((shortcut) => <button key={shortcut} type="button" onClick={() => fetchForecast(undefined, shortcut)}>{shortcut}</button>)}
      </section>

      <section className={`forecast-section ${requestState === "success" ? "is-fresh" : ""}`} aria-live="polite" ref={forecastRef}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR SKY, DECODED</p>
            <h2>{result.city}<span>, {result.country}</span></h2>
            <p>{dateLabel(result.date)} · <strong>{result.condition}</strong></p>
          </div>
          <div className="model-badge"><span>◉</span><div><b>{forecastConfidence}% confidence</b><small>Strongest for nearer dates</small></div></div>
        </div>

        <nav className="week-dock" aria-label="Seven-day forecast navigator">
          <div className="week-dock-label"><span>7 DAY</span><small>Stay in the details</small></div>
          <div className="week-dock-days">
            {weeklyForecast.map((day) => (
              <button className={day.date === result.date ? "is-selected" : ""} type="button" key={day.date} onClick={() => openForecastPage(day)} aria-pressed={day.date === result.date} aria-label={`Open ${weekdayLabel(day.date)} forecast details`}>
                <span>{weekdayLabel(day.date)}</span><b>{day.emoji}</b><small>{day.high}°</small>
              </button>
            ))}
          </div>
          <a href="#week-ahead" aria-label="Jump to full weekly forecast">Full week ↓</a>
        </nav>

        <section className="weekly-card" id="week-ahead" aria-labelledby="weekly-title">
          <div className="weekly-heading">
            <div><p className="card-kicker">THE WEEK AHEAD</p><h3 id="weekly-title">Seven days, zero surprises.</h3></div>
            <p>Pick a day to open its dedicated forecast page</p>
          </div>
          <div className="weekly-strip">
            {weeklyForecast.map((day) => (
              <button className={day.date === result.date ? "is-selected" : ""} type="button" key={day.date} onClick={() => openForecastPage(day)} aria-pressed={day.date === result.date}>
                <span className="weekly-day">{weekdayLabel(day.date)}<small>{new Date(`${day.date}T12:00:00`).getDate()}</small></span>
                <span className="weekly-icon" aria-label={day.condition}>{day.emoji}</span>
                <span className="weekly-temp"><b>{day.high}°</b><small>{day.low}°</small></span>
                <span className="weekly-rain">☂ {day.rain}%</span>
                <span className="weekly-wind">≋ {day.wind} km/h</span>
                <span className="weekly-condition">{day.condition}</span>
              </button>
            ))}
          </div>
          <div className="weekly-legend"><span><i className="legend-high" /> Day high</span><span><i className="legend-low" /> Night low</span><span>☂ Rain chance</span><span>≋ Wind speed</span></div>
          <div className="weekly-inline-preview" key={result.date}>
            <div className="inline-day-identity"><span>{result.emoji}</span><div><small>SELECTED DAY</small><h4>{dateLabel(result.date)}</h4><p>{result.condition}</p></div></div>
            <div className="inline-day-stats">
              <span><small>High / Low</small><b>{result.high}° / {result.low}°</b></span>
              <span><small>Rain</small><b>{result.rain}%</b></span>
              <span><small>Wind</small><b>{result.wind} km/h</b></span>
              <span><small>Best outside</small><b>{bestTime.label}</b></span>
            </div>
            <button type="button" onClick={() => openForecastPage(weeklyForecast.find((day) => day.date === result.date) ?? weeklyForecast[0])}>Open full details →</button>
          </div>
        </section>

        <section className="hourly-card" aria-labelledby="hourly-title">
          <div className="feature-heading"><div><p className="card-kicker">HOURLY WEATHER STORY</p><h3 id="hourly-title">How the day unfolds.</h3><p className="hourly-subtitle">A calm, two-hour rhythm from midnight to bedtime.</p></div><div className="best-time-pill"><span>✦ BEST OUTSIDE</span><b>{bestTime.label}</b><small>{bestTime.note} · {bestTime.score}/100</small></div></div>
          {hourlyForecast.length ? <><div className="day-periods"><span>☾ Night</span><span>☀ Morning</span><span>◉ Afternoon</span><span>✦ Evening</span></div><div className="hourly-strip">{hourlyDisplay.map((hour) => <article key={hour.time} className={`${bestTime.label.startsWith(timeLabel(hour.time)) ? "is-best" : ""} period-${hourPeriod(hour.time)}`}><time>{timeLabel(hour.time)}</time><span>{hour.emoji}</span><b>{hour.temperature}°</b><small>☂ {hour.rain}%</small><div className="rain-meter"><i style={{ width: `${Math.max(8, hour.rain)}%` }} /></div><em>{hour.wind} km/h</em></article>)}</div></> : <div className="empty-intel">Choose a city to unlock its full 24-hour story.</div>}
        </section>

        <section className="trip-intelligence" aria-label="Trip intelligence">
          <article className="score-card">
            <p className="card-kicker">SMART TRIP SCORE</p><h3>One forecast, five decisions.</h3>
            <div className="score-list">{tripScores.map((score) => <div key={score.label}><span>{score.icon} {score.label}</span><i><b style={{ width: `${score.value}%` }} /></i><strong>{score.value}</strong></div>)}</div>
          </article>
          <article className="alerts-card">
            <p className="card-kicker">WEATHER ALERTS</p><h3>{weatherAlerts.length ? `${weatherAlerts.length} thing${weatherAlerts.length > 1 ? "s" : ""} to watch` : "No drama detected."}</h3>
            <div className="alert-list">{weatherAlerts.length ? weatherAlerts.map((alert) => <div className={alert.level} key={alert.title}><span>{alert.icon}</span><p><b>{alert.title}</b>{alert.note}</p></div>) : <div className="safe"><span>✓</span><p><b>All clear</b>No severe signals in this forecast window.</p></div>}</div>
          </article>
        </section>

        <section className="intelligence-grid" aria-label="Weather intelligence tools">
          <article className="health-card intel-card">
            <div className="intel-icon">🫁</div><p className="card-kicker">AIR + HEALTH</p><h3 className={healthState === "loading" ? "is-loading-data" : ""} style={{ color: airQuality.color }}>{healthState === "loading" ? "Loading" : healthData.aqi ?? "—"} <small>US AQI · {healthState === "loading" ? "Reading the air…" : airQuality.label}</small></h3>
            <div className="health-stats"><span>PM2.5<b>{healthState === "loading" ? "···" : healthData.pm25 ?? "—"}</b></span><span>PM10<b>{healthState === "loading" ? "···" : healthData.pm10 ?? "—"}</b></span><span>Pollen<b>{healthState === "loading" ? "···" : healthData.pollen == null ? "N/A" : healthData.pollen.toFixed(1)}</b></span></div>
            <p>{healthState === "loading" ? `Fetching the latest health reading for ${city}…` : healthData.aqi == null ? "Air-quality data is unavailable for this location right now." : healthData.aqi <= 100 ? "Normal outdoor plans are generally fine. UV protection still matters." : "Sensitive travellers should reduce long outdoor exertion and keep a mask handy."}</p>
          </article>
          <article className="history-card intel-card">
            <div className="intel-icon">🕰</div><p className="card-kicker">HISTORICAL REALITY CHECK</p><h3>Same date, last year</h3>
            {historicalData ? <><div className="history-comparison"><span>Then<b>{historicalData.high}° / {historicalData.low}°</b><small>{historicalData.rain} mm rain</small></span><i>→</i><span>Forecast<b>{result.high}° / {result.low}°</b><small>{result.precipitation} mm rain</small></span></div><p>{Math.abs(result.high - historicalData.high) <= 2 ? "Temperature is tracking close to last year." : `This forecast is ${Math.abs(result.high - historicalData.high)}° ${result.high > historicalData.high ? "warmer" : "cooler"} than the same date last year.`}</p></> : <p>Historical comparison is taking a chai break for this location.</p>}
          </article>
          <article className="voice-card intel-card">
            <div className="intel-icon">🎙</div><p className="card-kicker">VOICE WEATHER BRIEFING</p><h3>Ask it. Hear it. Go.</h3><p>{voiceStatus}</p>
            <div className="voice-actions"><button type="button" onClick={startVoiceSearch}>◉ Ask by voice</button><button type="button" onClick={speakForecast}>▶ Listen</button></div>
          </article>
          <article className="share-card intel-card">
            <div className="intel-icon">✨</div><p className="card-kicker">SHAREABLE FORECAST</p><h3>Send the vibe, not a screenshot.</h3><p>Create a polished 1200×630 weather card or share the briefing directly.</p>
            <div className="voice-actions"><button type="button" onClick={downloadWeatherCard}>↓ Download card</button><button type="button" onClick={() => void shareForecast()}>↗ Share</button></div>
          </article>
        </section>

        <section className="radar-compare-grid">
          <article className="radar-card">
            <div className="feature-heading"><div><p className="card-kicker">LIVE RAIN RADAR</p><h3>See the clouds coming.</h3></div><a href="https://www.windy.com/" target="_blank" rel="noreferrer">Powered by Windy ↗</a></div>
            {radarUrl ? <><div className="radar-viewport"><iframe src={radarUrl} title={`View-only live rain radar for ${result.city}`} loading="lazy" tabIndex={-1} /></div><p className="radar-caption"><span>●</span> View-only radar · Zoom and timeline controls disabled</p></> : <div className="empty-intel">Search a city to centre the radar.</div>}
          </article>
          <article className="compare-card">
            <p className="card-kicker">DESTINATION DUEL</p><h3>Where should we actually go?</h3><p>Compare up to three cities for {dateLabel(date)}.</p>
            <form onSubmit={compareDestinations}><input value={comparisonQuery} onChange={(event) => setComparisonQuery(event.target.value)} placeholder="Mumbai, Bengaluru, Goa" aria-label="Cities to compare" /><button type="submit" disabled={comparisonLoading}>{comparisonLoading ? "Comparing…" : "Compare"}</button></form>
            <div className="comparison-results">{comparisonResults.map((place, index) => <div key={`${place.city}-${place.country}`}><span className="rank">#{index + 1}</span><span className="compare-icon">{place.emoji}</span><p><b>{place.city}</b><small>{place.condition} · ☂ {place.rain}%</small></p><strong>{place.score}<small>/100</small></strong></div>)}</div>
          </article>
        </section>
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

      <aside className="ad-slot" aria-label="Advertisement" data-ad-slot="home-inline" data-ad-filled="false">
        <span>ADVERTISEMENT</span><div className="ad-content" />
      </aside>

      <footer><span>MAUSAM KA MOOD™</span><span className="footer-slang" aria-live="polite">{footerSlang}</span><span>Built for people who have plans.</span></footer>
    </main>
  );
}
