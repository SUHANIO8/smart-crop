import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue } from "firebase/database";
import { rtdb } from "../services/firebase";

// ─────────────────────────────────────────────
// WIKIPEDIA REST API IMAGE FETCHER
// Free, no API key, no hotlink restrictions.
// Pulls the actual Wikipedia article thumbnail
// for each crop — guaranteed to be relevant.
// ─────────────────────────────────────────────
const WIKI_TITLES = {
  rice:          "Rice",
  maize:         "Maize",
  chickpea:      "Chickpea",
  kidneybeans:   "Kidney_bean",
  pigeonpeas:    "Pigeon_pea",
  mothbeans:     "Moth_bean",
  mungbean:      "Mung_bean",
  blackgram:     "Vigna_mungo",
  lentil:        "Lentil",
  pomegranate:   "Pomegranate",
  banana:        "Banana",
  mango:         "Mango",
  grapes:        "Grape",
  watermelon:    "Watermelon",
  muskmelon:     "Cantaloupe",
  apple:         "Apple",
  orange:        "Orange_(fruit)",
  papaya:        "Papaya",
  coconut:       "Coconut",
  cotton:        "Cotton",
  jute:          "Jute",
  coffee:        "Coffea",
  wheat:         "Wheat",
  sugarcane:     "Sugarcane",
  soybean:       "Soybean",
  mustard:       "Mustard_plant",
  groundnut:     "Peanut",
  barley:        "Barley",
  "pearl millet":"Pearl_millet",
  sorghum:       "Sorghum",
};

// In-memory cache — avoids repeat API calls for same crop
const imageCache = {};

const fetchWikiImage = async (cropName) => {
  const key = cropName.toLowerCase().trim();
  if (imageCache[key]) return imageCache[key];

  const title = WIKI_TITLES[key] || cropName;
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    );
    const data = await res.json();
    const url = data?.originalimage?.source || data?.thumbnail?.source || null;
    if (url) { imageCache[key] = url; return url; }
  } catch { /* fall through */ }

  return null; // triggers the green placeholder
};

// ─────────────────────────────────────────────
// ENV HELPER
// ─────────────────────────────────────────────
const getEnv = (key) => {
  try { return import.meta?.env?.[key] || ""; }
  catch { return ""; }
};

// ─────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────
const Btn = ({ children, onClick, type = "button", className = "", disabled = false }) => (
  <motion.button
    type={type} onClick={onClick} disabled={disabled}
    whileHover={{ scale: disabled ? 1 : 1.02 }}
    whileTap={{ scale: disabled ? 1 : 0.97 }}
    className={`px-4 py-2 bg-[#2d8a5b] text-white rounded-full hover:bg-[#24704a]
      focus:outline-none focus:ring-2 focus:ring-[#2d8a5b]/50
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-all duration-300 font-semibold ${className}`}
  >
    {children}
  </motion.button>
);

const Field = ({ label, name, value, onChange, type = "text", readOnly = false, placeholder = "" }) => (
  <div className="mb-4">
    {label && <label className="block text-slate-700 text-sm font-bold mb-1">{label}</label>}
    <input
      type={type} name={name} value={value} onChange={onChange}
      placeholder={placeholder} readOnly={readOnly}
      className={`appearance-none border border-slate-200 rounded-xl w-full py-2 px-3
        text-slate-700 text-sm leading-tight focus:outline-none focus:ring-2
        focus:ring-[#2d8a5b]/40 transition-all shadow-sm
        ${readOnly
          ? "bg-emerald-50 cursor-not-allowed font-mono text-emerald-800 font-bold border-emerald-200"
          : "bg-white"
        }`}
    />
  </div>
);

// ─────────────────────────────────────────────
// EXPLANATION GENERATOR
// ─────────────────────────────────────────────
const generateExplanation = (crop, form) => {
  const factors = [];
  const ph   = Number(form.ph);
  const temp = Number(form.temperature);
  const rain = Number(form.rainfall);
  const hum  = Number(form.humidity);
  if (ph > 6 && ph < 7.5) factors.push("optimal soil pH");
  if (temp > 24)           factors.push("ideal temperature conditions");
  if (rain > 100)          factors.push("sufficient rainfall availability");
  if (hum > 60)            factors.push("favorable humidity levels");
  return factors.length > 0
    ? `${crop} is recommended due to ${factors.join(", ")}, which align with its growth requirements.`
    : `Based on soil nutrients (N:${form.nitrogen}, P:${form.phosphorus}, K:${form.potassium}), ${crop} offers the best yield potential for these conditions.`;
};

// ─────────────────────────────────────────────
// CROP CARD — fetches Wikipedia image on mount
// ─────────────────────────────────────────────
const CropCard = ({ item, usingML, form }) => {
  const [imgUrl, setImgUrl]       = useState(null);
  const [imgReady, setImgReady]   = useState(false);

  useEffect(() => {
    setImgReady(false);
    fetchWikiImage(item.crop).then((url) => {
      setImgUrl(url);
      setImgReady(true);
    });
  }, [item.crop]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden
        ${item.rank === 1 ? "ring-2 ring-[#2d8a5b] border-transparent" : ""}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2">

        {/* Image panel */}
        <div className="relative overflow-hidden group min-h-[18rem]">
          {!imgReady ? (
            // Loading skeleton
            <div className="w-full h-72 md:h-full bg-gradient-to-br from-emerald-50 to-emerald-100 animate-pulse flex items-center justify-center">
              <span className="text-5xl opacity-30">🌿</span>
            </div>
          ) : imgUrl ? (
            <img
              src={imgUrl}
              alt={item.crop}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
              }}
              className="w-full h-72 md:h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            // Wikipedia returned no image — show a nice green placeholder
            <div className="w-full h-72 md:h-full bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center">
              <span className="text-7xl">🌾</span>
            </div>
          )}

          <div className="absolute top-4 left-4 bg-slate-900/90 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            Rank #{item.rank}
          </div>
          <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold
            ${usingML ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
            {usingML ? "🤖 ML Prediction" : "📊 Simulation"}
          </div>
        </div>

        {/* Info panel */}
        <div className="p-10 flex flex-col justify-center">
          <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-6">
            {item.crop}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-[#2d8a5b]" />
              <span className="font-bold text-xs uppercase text-slate-400 tracking-widest">
                Agronomic Insight
              </span>
            </div>
            <p className="text-slate-600 italic text-base leading-relaxed border-l-4 border-[#2d8a5b] pl-4 py-2 bg-slate-50 rounded-r-xl">
              {generateExplanation(item.crop, form)}
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────
const getRainfall = async (city) => {
  const key = getEnv("VITE_WEATHER_API_KEY");
  if (!key) throw new Error("Weather API key missing");
  const res = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${key}`
  );
  const rain = res.data.rain;
  return rain ? (rain["1h"] || rain["3h"] || 0) : 0;
};

const callFlaskPredict = async (features) => {
  const baseUrl = getEnv("VITE_API_BASE_URL") || "http://localhost:5000";
  const res = await axios.post(
    `${baseUrl}/predict`,
    { features },
    { timeout: 8000, headers: { "Content-Type": "application/json" } }
  );
  return res.data;
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function Predict() {
  const [city, setCity]                       = useState("");
  const [weatherLoading, setWeatherLoading]   = useState(false);
  const [form, setForm]                       = useState({
    nitrogen: "", phosphorus: "", potassium: "",
    ph: "", temperature: "", humidity: "", rainfall: "",
  });
  const [results, setResults]                 = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [fetchingSensors, setFetchingSensors] = useState(true);
  const [sensorConnected, setSensorConnected] = useState(false);
  const [usingML, setUsingML]                 = useState(false);
  const [error, setError]                     = useState("");

  // ── FIREBASE SENSOR SYNC ─────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => setFetchingSensors(false), 5000);
    const sensorRef = ref(rtdb, "sensor");
    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        clearTimeout(timeout);
        const data = snapshot.val();
        if (data) {
          setForm({
            nitrogen:    data.nitrogen    != null ? String(data.nitrogen)    : "",
            phosphorus:  data.phosphorus  != null ? String(data.phosphorus)  : "",
            potassium:   data.potassium   != null ? String(data.potassium)   : "",
            ph:          data.ph          != null ? String(data.ph)          : "",
            temperature: data.temperature != null ? String(data.temperature) : "",
            humidity:    data.humidity    != null ? String(data.humidity)    : "",
            rainfall:    data.rainfall    != null ? String(data.rainfall)    : "",
          });
          setSensorConnected(true);
        } else {
          setSensorConnected(false);
        }
        setFetchingSensors(false);
      },
      () => {
        clearTimeout(timeout);
        setSensorConnected(false);
        setFetchingSensors(false);
      }
    );
    return () => { clearTimeout(timeout); unsubscribe(); };
  }, []);

  // ── RAINFALL FETCH ───────────────────────────
  const handleFetchRainfall = async () => {
    if (!city.trim()) return setError("Please enter a city name.");
    setWeatherLoading(true);
    setError("");
    try {
      const mm = await getRainfall(city);
      setForm((p) => ({ ...p, rainfall: mm > 0 ? (mm * 100).toFixed(2) : "150.00" }));
    } catch {
      setError("City not found. Please try a different location.");
    } finally {
      setWeatherLoading(false);
    }
  };

  // ── PREDICTION ───────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);
    setUsingML(false);

    const required = ["nitrogen", "phosphorus", "potassium", "ph", "temperature", "humidity", "rainfall"];
    const missing = required.filter((f) => form[f] === "" || form[f] == null);
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(", ")}`);
      setLoading(false);
      return;
    }

    const features = [
      Number(form.nitrogen),
      Number(form.phosphorus),
      Number(form.potassium),
      Number(form.temperature),
      Number(form.humidity),
      Number(form.ph),
      Number(form.rainfall),
    ];

    let crops  = [];
    let mlUsed = false;

    try {
      console.log("Sending features to Flask:", features);
      const data = await callFlaskPredict(features);
      console.log("Flask response:", data);
      const recs = data?.recommendations;
      if (!recs || !Array.isArray(recs) || recs.length === 0) throw new Error("Bad response");
      crops  = recs.map((item) => ({ rank: item.rank, crop: item.crop }));
      mlUsed = true;
    } catch (err) {
      console.warn("ML prediction failed, using simulation:", err.message);
      const rainfall = Number(form.rainfall) || 0;
      if (rainfall > 200)
        crops = [{ rank:1, crop:"Rice" }, { rank:2, crop:"Jute" }, { rank:3, crop:"Sugarcane" }];
      else if (rainfall > 100)
        crops = [{ rank:1, crop:"Cotton" }, { rank:2, crop:"Maize" }, { rank:3, crop:"Soybean" }];
      else if (rainfall > 50)
        crops = [{ rank:1, crop:"Wheat" }, { rank:2, crop:"Barley" }, { rank:3, crop:"Mustard" }];
      else
        crops = [{ rank:1, crop:"Pearl Millet" }, { rank:2, crop:"Sorghum" }, { rank:3, crop:"Groundnut" }];
    }

    setResults(crops);
    setUsingML(mlUsed);
    setLoading(false);
  };

  // ── RENDER ───────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-12 px-6 font-sans antialiased text-slate-800">

      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-[#1a4d2e] mb-2 tracking-tight uppercase">
          Smart Crop Recommendation
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Integrated intelligence combining ESP32 telemetry with AI modeling.
        </p>
      </header>

      {/* Status bar */}
      <div className="mb-8 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${
            fetchingSensors ? "bg-amber-400 animate-pulse"
            : sensorConnected ? "bg-emerald-500"
            : "bg-red-400"
          }`} />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {fetchingSensors ? "Syncing IoT..." : sensorConnected ? "Sensor Active" : "Sensor Offline"}
          </span>
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${usingML ? "bg-emerald-500" : "bg-amber-400"}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {usingML ? "✓ ML Model Active" : "⚠ Simulation Mode"}
            </span>
          </div>
        )}
      </div>

      {/* Input grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        <div className="bg-white p-8 border border-slate-200 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-[#2d8a5b] flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158
                   a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172
                   a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828
                   c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Regional Context
          </h2>
          <Field
            label="Fetch Rainfall for Location"
            name="city" value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Nagpur, Buldhana"
          />
          <Btn onClick={handleFetchRainfall} disabled={weatherLoading} className="w-full">
            {weatherLoading ? "Fetching..." : "Sync Rainfall Data"}
          </Btn>
          <div className="mt-6 p-4 bg-[#f0fdf4] rounded-2xl border border-emerald-100">
            <p className="text-xs text-emerald-700 font-semibold mb-1">💡 How it works</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sensor data syncs automatically from Firebase. Click <strong>Get Recommendation</strong> to
              run the ML model on your Flask server at{" "}
              <code className="bg-slate-100 px-1 rounded">localhost:5000</code>.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 border border-slate-200 rounded-3xl shadow-xl">
          <h2 className="text-lg font-bold mb-5 border-b border-slate-100 pb-3 text-slate-700 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#2d8a5b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2
                   M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z
                   M9 9h6v6H9V9z" />
            </svg>
            Sensor Parameters
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              ["Nitrogen (N)",   "nitrogen"],
              ["Phosphorus (P)", "phosphorus"],
              ["Potassium (K)",  "potassium"],
              ["Soil pH",        "ph"],
              ["Temp (°C)",      "temperature"],
              ["Humidity (%)",   "humidity"],
            ].map(([label, name]) => (
              <Field
                key={name} label={label} name={name}
                value={form[name]} readOnly={sensorConnected}
                onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
              />
            ))}
          </div>

          <Field
            label="Rainfall (mm)" name="rainfall" type="number"
            value={form.rainfall}
            onChange={(e) => setForm((p) => ({ ...p, rainfall: e.target.value }))}
            placeholder="Enter or sync from weather"
          />

          <Btn
            type="submit"
            className="w-full mt-2 py-4 text-base font-bold"
            disabled={loading || fetchingSensors}
          >
            {fetchingSensors ? "Waiting for Sensor..." : loading ? "Running ML Model..." : "Get Recommendation"}
          </Btn>
        </form>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100 text-center font-semibold text-sm"
        >
          ⚠️ {error}
        </motion.div>
      )}

      {/* Results */}
      <div className="mt-16 space-y-10">
        <AnimatePresence>
          {results.map((item) => (
            <CropCard key={item.crop} item={item} usingML={usingML} form={form} />
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}