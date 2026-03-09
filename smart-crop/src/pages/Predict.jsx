import api from "../utils/api";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
// --- FIREBASE INTEGRATION ---
import { ref, onValue } from "firebase/database";
import { rtdb } from "../services/firebase";

/**
 * CONSOLIDATED COMPONENTS
 */

const Button = ({ children, onClick, type = 'button', className = '', disabled = false, ...props }) => (
  <motion.button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-emerald-600 text-white rounded-vibe hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg ${className}`}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    {...props}
  >
    {children}
  </motion.button>
);

const Input = ({ label, type = 'text', value, onChange, placeholder, className = '', readOnly = false, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-slate-700 text-sm font-bold mb-2">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`shadow-vibe appearance-none border border-slate-200 rounded-vibe w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${readOnly ? 'bg-gray-50 cursor-not-allowed font-mono text-emerald-700 font-bold border-emerald-100' : ''} ${className}`}
      {...props}
    />
  </div>
);

/**
 * CONSOLIDATED SERVICES & UTILITIES
 */



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
    if (!key) throw new Error("API Key missing");
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${key}`;
    const response = await axios.get(url);
    return {
      rainfall: response.data.rain ? (response.data.rain['1h'] || response.data.rain['3h'] || 0) : 0
    };
  }
};

const imageService = {
  async getCropImage(cropName) {
    const key = getEnv("VITE_UNSPLASH_ACCESS_KEY");
    if (!key) return 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1000';
    const url = `https://api.unsplash.com/search/photos?query=${cropName} crop agriculture&per_page=1&client_id=${key}`;
    try {
      const response = await axios.get(url);
      return response.data.results[0]?.urls?.regular || 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1000';
    } catch {
      return 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1000';
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

/**
 * MAIN COMPONENT
 */

export default function Predict() {
  const [city, setCity] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [form, setForm] = useState({
    nitrogen: '', phosphorus: '', potassium: '', ph: '', temperature: '', humidity: '', rainfall: ''
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSensors, setFetchingSensors] = useState(true);
  const [error, setError] = useState('');

  // --- 1. FIREBASE AUTOMATED DATA SYNC ---
  useEffect(() => {
    // Listening to 'sensor' node directly based on your database structure
    const sensorRef = ref(rtdb, 'sensor');

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setForm({
          nitrogen: data.nitrogen !== undefined ? String(data.nitrogen) : '',
          phosphorus: data.phosphorus !== undefined ? String(data.phosphorus) : '',
          potassium: data.potassium !== undefined ? String(data.potassium) : '',
          ph: data.ph !== undefined ? String(data.ph) : '',
          temperature: data.temperature !== undefined ? String(data.temperature) : '',
          humidity: data.humidity !== undefined ? String(data.humidity) : '',
          rainfall: data.rainfall !== undefined ? String(data.rainfall) : ''
        });
        setError('');
      } else {
        setError('No sensor data found. Ensure ESP32 is pushing to the "sensor" node.');
      }
      setFetchingSensors(false);
    }, (err) => {
      setError('Firebase Sync Error: ' + err.message);
      setFetchingSensors(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };


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
    } catch (err) {
      setError("Location search failed. Using regional averages.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post("/predict", {
  features: [
    Number(form.nitrogen),
    Number(form.phosphorus),
    Number(form.potassium),
    Number(form.temperature),
    Number(form.humidity),
    Number(form.ph),
    Number(form.rainfall)
  ]
});

console.log("Prediction Response:", response.data);

const rankedCrops = await Promise.all(
  response.data.recommendations.map(async (item) => ({
    ...item,
    imageUrl: await imageService.getCropImage(item.crop)
  }))
);

setResults(rankedCrops);

    } catch (err) {
      // Generate rainfall-based mock predictions when backend is unreachable
      const rainfall = Number(form.rainfall) || 0;
      
      let mockCrops = [];
      if (rainfall > 200) {
        // High rainfall crops
        mockCrops = [
          { rank: 1, crop: "Rice", confidence: 92 },
          { rank: 2, crop: "Jute", confidence: 85 },
          { rank: 3, crop: "Sugarcane", confidence: 78 }
        ];
      } else if (rainfall > 100) {
        // Medium-high rainfall crops
        mockCrops = [
          { rank: 1, crop: "Cotton", confidence: 90 },
          { rank: 2, crop: "Maize", confidence: 84 },
          { rank: 3, crop: "Soybean", confidence: 77 }
        ];
      } else if (rainfall > 50) {
        // Medium-low rainfall crops
        mockCrops = [
          { rank: 1, crop: "Wheat", confidence: 94 },
          { rank: 2, crop: "Barley", confidence: 87 },
          { rank: 3, crop: "Mustard", confidence: 80 }
        ];
      } else {
        // Low rainfall/drought-tolerant crops
        mockCrops = [
          { rank: 1, crop: "Pearl Millet", confidence: 91 },
          { rank: 2, crop: "Sorghum", confidence: 85 },
          { rank: 3, crop: "Groundnut", confidence: 78 }
        ];
      }
      
      const ranked = await Promise.all(mockCrops.map(async (i) => ({
        ...i, imageUrl: await imageService.getCropImage(i.crop)
      })));
      setResults(ranked);
      setError("Backend unreachable. Displaying simulation based on current sensors.");
    } finally {
      setLoading(false);
    }
  };

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
        <div className={`w-3 h-3 rounded-full ${fetchingSensors ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {fetchingSensors ? 'Syncing with IoT Node...' : 'Hardware Stream Active'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Rainfall / Location context */}
        <div className="bg-white p-8 border border-slate-200 rounded-[2rem] shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-emerald-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Regional Context
          </h2>
          <Input
            label="Fetch Rainfall for Location"
            placeholder="e.g. Buldhana, Nagpur"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Button
            onClick={handleFetchRainfall}
            disabled={weatherLoading}
            className="w-full bg-emerald-600"
          >
            {weatherLoading ? 'Updating...' : 'Sync Rainfall Data'}
          </Button>
        </div>

        {/* Sensor Form - Strictly ReadOnly */}
        <form onSubmit={handleSubmit} className="bg-white p-8 border border-slate-200 rounded-[2rem] shadow-xl">
          <h2 className="text-xl font-bold mb-6 border-b border-slate-50 pb-4 text-slate-700 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Sensor Parameters
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Nitrogen (N)" value={form.nitrogen} readOnly />
            <Input label="Phosphorus (P)" value={form.phosphorus} readOnly />
            <Input label="Potassium (K)" value={form.potassium} readOnly />
            <Input label="Soil pH" value={form.ph} readOnly />
            <Input label="Temp (°C)" value={form.temperature} readOnly />
            <Input label="Humidity (%)" value={form.humidity} readOnly />
          </div>

          <Input
            label="Rainfall (mm)"
            name="rainfall"
            type="number"
            value={form.rainfall}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                rainfall: e.target.value
              }))
            }
            placeholder="Enter rainfall manually"
          />


          <Button
            type="submit"
            className="w-full mt-4 py-4 text-lg font-black"
            disabled={loading || fetchingSensors}
          >
            {loading ? 'Analyzing Data...' : 'Get Recommendation'}
          </Button>
        </form>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100 text-center font-bold text-sm">
          {error}
        </motion.div>
      )}

      {/* Results Section */}
      <div className="mt-20 space-y-10">
        <AnimatePresence>
          {results.map((item) => (
            <motion.div
              key={item.crop}
              className={`bg-white border border-slate-200 rounded-[2.5rem] shadow-vibe overflow-hidden ${item.rank === 1 ? 'ring-2 ring-emerald-400 border-transparent' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative overflow-hidden group">
                  <img
                    src={item.imageUrl}
                    alt={item.crop}
                    className="w-full h-72 md:h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/90 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Rank #{item.rank}
                  </div>
                </div>

                <div className="p-10 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                      {item.crop}
                    </h3>
                    {/* <div className="text-right">
                       <p className="text-3xl font-black text-emerald-600 leading-none">{item.confidence}%</p>
                       <p className="text-[10px] font-bold text-slate-300 uppercase">Match Score</p>
                    </div> */}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-px w-8 bg-emerald-500"></div>
                      <span className="font-bold text-xs uppercase text-slate-400 tracking-widest">Agronomic Insight</span>
                    </div>
                    <p className="text-slate-600 italic text-xl leading-relaxed border-l-4 border-emerald-500 pl-6 py-2 bg-slate-50 rounded-r-xl">
                      {generateExplanation(item.crop, form)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}