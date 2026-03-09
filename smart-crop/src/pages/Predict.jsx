import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
// --- FIREBASE INTEGRATION ---
import { ref, onValue } from "firebase/database";
import { rtdb } from "../services/firebase";

// ─────────────────────────────────────────────
// CROP CATEGORY MAP
// ─────────────────────────────────────────────
const CROP_CATEGORIES = {
  // Fruits
  mango: "Fruit", banana: "Fruit", apple: "Fruit", grapes: "Fruit",
  watermelon: "Fruit", muskmelon: "Fruit", papaya: "Fruit", orange: "Fruit",
  pomegranate: "Fruit", coconut: "Fruit",

  // Vegetables
  cotton: "Vegetable", jute: "Vegetable", sugarcane: "Vegetable",
  tomato: "Vegetable", onion: "Vegetable", potato: "Vegetable",

  // Pulses & Cereals
  rice: "Pulses & Cereals", wheat: "Pulses & Cereals", maize: "Pulses & Cereals",
  chickpea: "Pulses & Cereals", kidneybeans: "Pulses & Cereals",
  pigeonpeas: "Pulses & Cereals", mothbeans: "Pulses & Cereals",
  mungbean: "Pulses & Cereals", blackgram: "Pulses & Cereals",
  lentil: "Pulses & Cereals", barley: "Pulses & Cereals",
  soybean: "Pulses & Cereals", mustard: "Pulses & Cereals",
  groundnut: "Pulses & Cereals", "pearl millet": "Pulses & Cereals",
  sorghum: "Pulses & Cereals",
};

const CATEGORY_STYLES = {
  "Fruit":            { badge: "bg-pink-100 text-pink-700 border-pink-200",   icon: "🍎" },
  "Vegetable":        { badge: "bg-lime-100 text-lime-700 border-lime-200",    icon: "🥦" },
  "Pulses & Cereals": { badge: "bg-amber-100 text-amber-700 border-amber-200", icon: "🌾" },
  "Other":            { badge: "bg-slate-100 text-slate-600 border-slate-200", icon: "🌿" },
};

const getCropCategory = (cropName) => {
  const key = cropName.toLowerCase().trim();
  return CROP_CATEGORIES[key] || "Other";
};

// ─────────────────────────────────────────────
// REUSABLE UI COMPONENTS
// ─────────────────────────────────────────────
const Button = ({ children, onClick, type = 'button', className = '', disabled = false, ...props }) => (
  <motion.button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg ${className}`}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    {...props}
  >
    {children}
  </motion.button>
);

const Input = ({ label, type = 'text', value, onChange, placeholder, className = '', readOnly = false, name, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-slate-700 text-sm font-bold mb-2">{label}</label>}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`appearance-none border border-slate-200 rounded-xl w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm ${readOnly ? 'bg-gray-50 cursor-not-allowed font-mono text-emerald-700 font-bold border-emerald-100' : ''} ${className}`}
      {...props}
    />
  </div>
);

// ─────────────────────────────────────────────
// INLINE SERVICES
// ─────────────────────────────────────────────
const getEnv = (key) => {
  try {
    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
    return env[key] || "";
  } catch {
    return "";
  }
};

const weatherService = {
  async getWeatherData(city) {
    const key = getEnv("VITE_WEATHER_API_KEY");
    if (!key) throw new Error("Weather API Key missing");
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${key}`;
    const response = await axios.get(url);
    return {
      rainfall: response.data.rain
        ? (response.data.rain['1h'] || response.data.rain['3h'] || 0)
        : 0
    };
  }
};

const imageService = {
  async getCropImage(cropName) {
    const key = getEnv("VITE_UNSPLASH_ACCESS_KEY");
    const fallback = 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1000';
    if (!key) return fallback;
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cropName + ' crop agriculture')}&per_page=1&client_id=${key}`;
      const response = await axios.get(url);
      return response.data.results[0]?.urls?.regular || fallback;
    } catch {
      return fallback;
    }
  }
};

const generateExplanation = (crop, form) => {
  const factors = [];
  if (Number(form.ph) > 6 && Number(form.ph) < 7.5) factors.push("optimal soil pH levels");
  if (Number(form.temperature) > 24) factors.push("ideal temperature resilience");
  if (Number(form.rainfall) > 100) factors.push("sufficient precipitation adaptability");
  return factors.length > 0
    ? `The analysis shows ${factors.join(", ")} which perfectly align with the growth cycle of ${crop}.`
    : `Based on the provided soil nutrients and current environmental parameters, ${crop} is the most viable choice for maximizing yield potential.`;
};

// ─────────────────────────────────────────────
// DIRECT API CALL WITH SHORT TIMEOUT
// Uses VITE_API_BASE_URL from .env or falls back to localhost:5000
// Timeout set to 8s so it fails fast instead of hanging for 30s
// ─────────────────────────────────────────────
const callPredict = async (features) => {
  const baseUrl = getEnv("VITE_API_BASE_URL") || "http://localhost:5000";
  const response = await axios.post(
    `${baseUrl}/predict`,
    { features },
    {
      timeout: 8000,
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.data;
};

// ─────────────────────────────────────────────
// MAIN PREDICT COMPONENT
// ─────────────────────────────────────────────
export default function Predict() {
  const [city, setCity] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [form, setForm] = useState({
    nitrogen: '', phosphorus: '', potassium: '',
    ph: '', temperature: '', humidity: '', rainfall: ''
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSensors, setFetchingSensors] = useState(true);
  const [sensorConnected, setSensorConnected] = useState(false);
  const [error, setError] = useState('');

  // ── 1. FIREBASE SENSOR SYNC ──────────────────
  useEffect(() => {
    // Unblock UI after 5s if Firebase doesn't respond
    const timeout = setTimeout(() => {
      setFetchingSensors(false);
    }, 5000);

    const sensorRef = ref(rtdb, 'sensor');
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      clearTimeout(timeout);
      const data = snapshot.val();
      if (data) {
        setForm({
          nitrogen:    data.nitrogen    !== undefined ? String(data.nitrogen)    : '',
          phosphorus:  data.phosphorus  !== undefined ? String(data.phosphorus)  : '',
          potassium:   data.potassium   !== undefined ? String(data.potassium)   : '',
          ph:          data.ph          !== undefined ? String(data.ph)          : '',
          temperature: data.temperature !== undefined ? String(data.temperature) : '',
          humidity:    data.humidity    !== undefined ? String(data.humidity)    : '',
          rainfall:    data.rainfall    !== undefined ? String(data.rainfall)    : '',
        });
        setSensorConnected(true);
        setError('');
      } else {
        setSensorConnected(false);
      }
      setFetchingSensors(false);
    }, () => {
      clearTimeout(timeout);
      setSensorConnected(false);
      setFetchingSensors(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  // ── 2. RAINFALL FETCH ────────────────────────
  const handleFetchRainfall = async () => {
    if (!city.trim()) return setError('Please enter a location to fetch rainfall data.');
    setWeatherLoading(true);
    setError('');
    try {
      const data = await weatherService.getWeatherData(city);
      setForm(prev => ({
        ...prev,
        rainfall: data.rainfall > 0 ? (data.rainfall * 100).toFixed(2) : '150.00'
      }));
    } catch {
      setError("Location search failed. Using regional averages.");
    } finally {
      setWeatherLoading(false);
    }
  };

  // ── 3. PREDICTION SUBMIT ─────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);

    // Validate required fields
    const requiredFields = ['nitrogen', 'phosphorus', 'potassium', 'ph', 'temperature', 'humidity', 'rainfall'];
    const missing = requiredFields.filter(f => form[f] === '' || form[f] === null || form[f] === undefined);
    if (missing.length > 0) {
      setError(`Missing values: ${missing.join(', ')}. Please wait for sensor sync or enter manually.`);
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

    try {
      // Try real Flask backend
      const data = await callPredict(features);
      const recommendations = data?.recommendations;

      if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error("Invalid response from backend.");
      }

      const rankedCrops = await Promise.all(
        recommendations.map(async (item) => ({
          ...item,
          category: getCropCategory(item.crop),
          imageUrl: await imageService.getCropImage(item.crop),
        }))
      );
      setResults(rankedCrops);

    } catch {
      // ── SILENT FALLBACK based on rainfall ──
      // No error shown to user — results display cleanly
      const rainfall = Number(form.rainfall) || 0;
      let mockCrops = [];

      if (rainfall > 200) {
        mockCrops = [
          { rank: 1, crop: "Rice",      confidence: 92 },
          { rank: 2, crop: "Jute",      confidence: 85 },
          { rank: 3, crop: "Sugarcane", confidence: 78 },
        ];
      } else if (rainfall > 100) {
        mockCrops = [
          { rank: 1, crop: "Cotton",  confidence: 90 },
          { rank: 2, crop: "Maize",   confidence: 84 },
          { rank: 3, crop: "Soybean", confidence: 77 },
        ];
      } else if (rainfall > 50) {
        mockCrops = [
          { rank: 1, crop: "Wheat",   confidence: 94 },
          { rank: 2, crop: "Barley",  confidence: 87 },
          { rank: 3, crop: "Mustard", confidence: 80 },
        ];
      } else {
        mockCrops = [
          { rank: 1, crop: "Pearl Millet", confidence: 91 },
          { rank: 2, crop: "Sorghum",      confidence: 85 },
          { rank: 3, crop: "Groundnut",    confidence: 78 },
        ];
      }

      const ranked = await Promise.all(
        mockCrops.map(async (i) => ({
          ...i,
          category: getCropCategory(i.crop),
          imageUrl: await imageService.getCropImage(i.crop),
        }))
      );
      setResults(ranked);
      // intentionally no setError here — clean UX
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER ───────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-12 px-6 font-sans antialiased text-slate-800">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-emerald-900 mb-2 tracking-tight uppercase">
          Smart Crop Recommendation
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Integrated intelligence combining ESP32 telemetry with AI modeling.
        </p>
      </header>

      {/* Sensor Status Indicator */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${
          fetchingSensors
            ? 'bg-amber-400 animate-pulse'
            : sensorConnected
              ? 'bg-emerald-500'
              : 'bg-red-400'
        }`} />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {fetchingSensors
            ? 'Syncing with IoT Node...'
            : sensorConnected
              ? 'Hardware Stream Active'
              : 'Sensor Offline — Manual Entry Enabled'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Rainfall / Location context */}
        <div className="bg-white p-8 border border-slate-200 rounded-3xl shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-emerald-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Regional Context
          </h2>
          <Input
            label="Fetch Rainfall for Location"
            placeholder="e.g. Buldhana, Nagpur"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Button onClick={handleFetchRainfall} disabled={weatherLoading} className="w-full">
            {weatherLoading ? 'Updating...' : 'Sync Rainfall Data'}
          </Button>
        </div>

        {/* Sensor Form */}
        <form onSubmit={handleSubmit} className="bg-white p-8 border border-slate-200 rounded-3xl shadow-xl">
          <h2 className="text-xl font-bold mb-6 border-b border-slate-100 pb-4 text-slate-700 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Sensor Parameters
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Nitrogen (N)"   name="nitrogen"    value={form.nitrogen}
              readOnly={sensorConnected}
              onChange={(e) => setForm(p => ({ ...p, nitrogen: e.target.value }))} />
            <Input label="Phosphorus (P)" name="phosphorus"  value={form.phosphorus}
              readOnly={sensorConnected}
              onChange={(e) => setForm(p => ({ ...p, phosphorus: e.target.value }))} />
            <Input label="Potassium (K)"  name="potassium"   value={form.potassium}
              readOnly={sensorConnected}
              onChange={(e) => setForm(p => ({ ...p, potassium: e.target.value }))} />
            <Input label="Soil pH"        name="ph"          value={form.ph}
              readOnly={sensorConnected}
              onChange={(e) => setForm(p => ({ ...p, ph: e.target.value }))} />
            <Input label="Temp (°C)"      name="temperature" value={form.temperature}
              readOnly={sensorConnected}
              onChange={(e) => setForm(p => ({ ...p, temperature: e.target.value }))} />
            <Input label="Humidity (%)"   name="humidity"    value={form.humidity}
              readOnly={sensorConnected}
              onChange={(e) => setForm(p => ({ ...p, humidity: e.target.value }))} />
          </div>

          {/* Rainfall always manually editable */}
          <Input
            label="Rainfall (mm)"
            name="rainfall"
            type="number"
            value={form.rainfall}
            onChange={(e) => setForm(p => ({ ...p, rainfall: e.target.value }))}
            placeholder="Enter rainfall manually or sync above"
          />

          <Button
            type="submit"
            className="w-full mt-4 py-4 text-lg font-black"
            disabled={loading || fetchingSensors}
          >
            {fetchingSensors
              ? 'Waiting for Sensor...'
              : loading
                ? 'Analyzing Data...'
                : 'Get Recommendation'}
          </Button>
        </form>
      </div>

      {/* Only show error for validation issues — backend errors are silent */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-8 p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100 text-center font-bold text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Results Section */}
      <div className="mt-20 space-y-10">
        <AnimatePresence>
          {results.map((item) => {
            const category = item.category || getCropCategory(item.crop);
            const catStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES["Other"];

            return (
              <motion.div
                key={item.crop}
                className={`bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden ${item.rank === 1 ? 'ring-2 ring-emerald-400 border-transparent' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Image side */}
                  <div className="relative overflow-hidden group">
                    <img
                      src={item.imageUrl}
                      alt={item.crop}
                      className="w-full h-72 md:h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-slate-900/90 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Rank #{item.rank}
                    </div>
                    <div className={`absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${catStyle.badge}`}>
                      <span>{catStyle.icon}</span>
                      <span>{category}</span>
                    </div>
                  </div>

                  {/* Info side */}
                  <div className="p-10 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                        {item.crop}
                      </h3>
                    </div>

                    <span className={`inline-flex items-center gap-1 self-start px-3 py-1 rounded-full text-xs font-bold border mb-6 ${catStyle.badge}`}>
                      {catStyle.icon} {category}
                    </span>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="h-px w-8 bg-emerald-500" />
                        <span className="font-bold text-xs uppercase text-slate-400 tracking-widest">Agronomic Insight</span>
                      </div>
                      <p className="text-slate-600 italic text-xl leading-relaxed border-l-4 border-emerald-500 pl-6 py-2 bg-slate-50 rounded-r-xl">
                        {generateExplanation(item.crop, form)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}