import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue } from "firebase/database";
import { rtdb } from "../services/firebase";

// ─────────────────────────────────────────────
// WIKIPEDIA REST API IMAGE FETCHER
// ─────────────────────────────────────────────
const WIKI_TITLES = {
  rice:           "Rice",
  maize:          "Maize",
  chickpea:       "Chickpea",
  kidneybeans:    "Kidney_bean",
  pigeonpeas:     "Pigeon_pea",
  mothbeans:      "Moth_bean",
  mungbean:       "Mung_bean",
  blackgram:      "Vigna_mungo",
  lentil:         "Lentil",
  pomegranate:    "Pomegranate",
  banana:         "Banana",
  mango:          "Mango",
  grapes:         "Grape",
  watermelon:     "Watermelon",
  muskmelon:      "Cantaloupe",
  apple:          "Apple",
  orange:         "Orange_(fruit)",
  papaya:         "Papaya",
  coconut:        "Coconut",
  cotton:         "Cotton",
  jute:           "Jute",
  coffee:         "Coffea",
  wheat:          "Wheat",
  sugarcane:      "Sugarcane",
  soybean:        "Soybean",
  mustard:        "Mustard_plant",
  groundnut:      "Peanut",
  barley:         "Barley",
  "pearl millet": "Pearl_millet",
  sorghum:        "Sorghum",
};

const imageCache = {};
const fetchWikiImage = async (cropName) => {
  const key = cropName.toLowerCase().trim();
  if (imageCache[key]) return imageCache[key];
  const title = WIKI_TITLES[key] || cropName;
  try {
    const res  = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    const data = await res.json();
    const url  = data?.originalimage?.source || data?.thumbnail?.source || null;
    if (url) { imageCache[key] = url; return url; }
  } catch { /* ignore */ }
  return null;
};

const getEnv = (key) => {
  try { return import.meta?.env?.[key] || ""; }
  catch { return ""; }
};

const FIELD_CONFIG = {
  nitrogen: {
    label: "Nitrogen (N)",
    unit: "mg/kg",
    placeholder: "0 – 140",
    min: 0, max: 140, step: 1,
  },
  phosphorus: {
    label: "Phosphorus (P)",
    unit: "mg/kg",
    placeholder: "0 – 145",
    min: 0, max: 145, step: 1,
  },
  potassium: {
    label: "Potassium (K)",
    unit: "mg/kg",
    placeholder: "0 – 205",
    min: 0, max: 205, step: 1,
  },
  ph: {
    label: "Soil pH",
    unit: "",
    placeholder: "3.0 – 10.0",
    min: 3, max: 10, step: 0.1,
  },
  rainfall: {
    label: "Rainfall (mm)",
    unit: "mm",
    placeholder: "0 – 300",
    min: 0, max: 300, step: 0.1,
  },
};

// Manual-only empty form (temp & humidity excluded — auto from Firebase)
const EMPTY_MANUAL = {
  nitrogen:   "",
  phosphorus: "",
  potassium:  "",
  ph:         "",
  rainfall:   "",
};

const AutoReadField = ({ label, value, unit, loading }) => (
  <div>
    <label className="block text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">
      {label}
      <span className="ml-2 text-emerald-600 normal-case tracking-normal font-semibold">
        ● Auto / Firebase
      </span>
    </label>
    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 min-h-[40px] shadow-sm">
      {loading ? (
        <span className="text-xs text-slate-400 italic animate-pulse">Connecting to sensor…</span>
      ) : value !== "" ? (
        <>
          <span className="text-emerald-800 font-mono font-bold text-sm">{value}</span>
          {unit && <span className="text-emerald-600 text-xs font-medium">{unit}</span>}
        </>
      ) : (
        <span className="text-xs text-amber-500 font-medium">Waiting for ESP32 data…</span>
      )}
    </div>
  </div>
);

/** Constrained number input — clamps & shows error if out of range */
const ConstrainedField = ({ fieldKey, value, onChange, error }) => {
  const cfg = FIELD_CONFIG[fieldKey];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">
          {cfg.label}
        </label>
        <span className="text-[10px] text-slate-400 font-medium">
          max {cfg.max}{cfg.unit ? " " + cfg.unit : ""}
        </span>
      </div>
      <div className="relative">
        <input
          type="number"
          name={fieldKey}
          value={value}
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          placeholder={cfg.placeholder}
          onChange={onChange}
          onKeyDown={(e) => {
            // Block exponential notation keys
            if (["e", "E", "+"].includes(e.key)) e.preventDefault();
          }}
          className={`w-full border rounded-xl py-2 pl-3 ${cfg.unit ? "pr-14" : "pr-3"}
            text-sm text-slate-700 shadow-sm outline-none transition-all
            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none
            ${error
              ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300"
              : "border-slate-200 bg-white hover:border-slate-300 focus:ring-2 focus:ring-[#2d8a5b]/40"
            }`}
        />
        {cfg.unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold pointer-events-none">
            {cfg.unit}
          </span>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-[10px] mt-1 font-medium">{error}</p>
      )}
    </div>
  );
};

const generateExplanation = (crop, form) => {
  const factors = [];
  const ph   = Number(form.ph);
  const temp = Number(form.temperature);
  const rain = Number(form.rainfall);
  const hum  = Number(form.humidity);
  if (ph > 6 && ph < 7.5) factors.push("optimal soil pH");
  if (temp > 24)           factors.push("ideal temperature conditions");
  if (rain > 100)          factors.push("sufficient rainfall");
  if (hum > 60)            factors.push("favorable humidity");
  return factors.length > 0
    ? `${crop} is recommended due to ${factors.join(", ")}, which align with its growth requirements.`
    : `Based on soil nutrients, ${crop} offers the best yield potential.`;
};

const CropCard = ({ item, usingML, form }) => {
  const [imgUrl,   setImgUrl]   = useState(null);
  const [imgReady, setImgReady] = useState(false);

  useEffect(() => {
    setImgReady(false);
    fetchWikiImage(item.crop).then((url) => { setImgUrl(url); setImgReady(true); });
  }, [item.crop]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className={`bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden
        ${item.rank === 1 ? "ring-2 ring-[#2d8a5b] border-transparent" : ""}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="relative overflow-hidden group min-h-[18rem]">
          {!imgReady
            ? <div className="w-full h-72 md:h-full bg-emerald-50 animate-pulse flex items-center justify-center">
                <span className="text-5xl opacity-30">🌿</span>
              </div>
            : imgUrl
              ? <img src={imgUrl} alt={item.crop} className="w-full h-72 md:h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              : <div className="w-full h-72 md:h-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-7xl">🌾</span>
                </div>
          }
          <div className="absolute top-4 left-4 bg-slate-900/90 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            Rank #{item.rank}
          </div>
          <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold
            ${usingML ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
            {usingML ? "🤖 ML Prediction" : "📊 Simulation"}
          </div>
        </div>
        <div className="p-10 flex flex-col justify-center">
          <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-6">
            {item.crop}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-[#2d8a5b]" />
              <span className="font-bold text-xs uppercase text-slate-400 tracking-widest">Agronomic Insight</span>
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

export default function Predict() {

  // ── Auto: Temperature & Humidity only (read-only, from Firebase) ──────────
  const [autoValues,      setAutoValues]      = useState({ temperature: "", humidity: "" });
  const [sensorConnected, setSensorConnected] = useState(false);
  const [sensorLoading,   setSensorLoading]   = useState(true);

  // ── Manual: N, P, K, pH, Rainfall ─────────────────────────────────────────
  const [manualForm,  setManualForm]  = useState(EMPTY_MANUAL);
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Results & UI state ─────────────────────────────────────────────────────
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usingML, setUsingML] = useState(false);
  const [error,   setError]   = useState("");

  // ── 1. Firebase listener — reads ONLY temperature & humidity ──────────────
  useEffect(() => {
    const sensorRef = ref(rtdb, "sensor");
    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setAutoValues({
            temperature: data.temperature != null ? String(Number(data.temperature).toFixed(1)) : "",
            humidity:    data.humidity    != null ? String(Number(data.humidity).toFixed(1))    : "",
          });
          setSensorConnected(true);
        } else {
          setSensorConnected(false);
        }
        setSensorLoading(false);
      },
      (err) => {
        console.error("Firebase read error:", err);
        setSensorConnected(false);
        setSensorLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ── 2. Constrained manual field change ────────────────────────────────────
  const handleManualChange = useCallback((e) => {
    const { name, value } = e.target;
    const cfg = FIELD_CONFIG[name];

    // Allow clearing the field
    if (value === "") {
      setManualForm((prev) => ({ ...prev, [name]: "" }));
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }

    const num = parseFloat(value);

    // Clamp to max — don't allow typing beyond limit
    if (!isNaN(num) && num > cfg.max) {
      setManualForm((prev) => ({ ...prev, [name]: String(cfg.max) }));
      setFieldErrors((prev) => ({
        ...prev,
        [name]: `Maximum allowed: ${cfg.max}${cfg.unit ? " " + cfg.unit : ""}`,
      }));
      return;
    }

    // Clamp to min
    if (!isNaN(num) && num < cfg.min) {
      setManualForm((prev) => ({ ...prev, [name]: String(cfg.min) }));
      setFieldErrors((prev) => ({
        ...prev,
        [name]: `Minimum allowed: ${cfg.min}`,
      }));
      return;
    }

    // Valid value
    setManualForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  // ── 3. Clear all ──────────────────────────────────────────────────────────
  const handleClearManual = () => {
    setManualForm(EMPTY_MANUAL);
    setFieldErrors({});
    setResults([]);
    setError("");
  };

  // ── 4. Validate before submit ─────────────────────────────────────────────
  const validateAll = () => {
    const errs = {};

    Object.keys(EMPTY_MANUAL).forEach((key) => {
      const val = manualForm[key];
      const cfg = FIELD_CONFIG[key];
      if (val === "" || val === undefined) { errs[key] = "Required"; return; }
      const num = parseFloat(val);
      if (isNaN(num))    { errs[key] = "Enter a valid number"; return; }
      if (num < cfg.min) { errs[key] = `Min: ${cfg.min}`; }
      if (num > cfg.max) { errs[key] = `Max: ${cfg.max}`; }
    });

    if (!autoValues.temperature || !autoValues.humidity) {
      errs._sensor = "Temperature / Humidity not received from sensor yet. Check ESP32 connection.";
    }

    return errs;
  };

  // ── 5. Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setResults([]);

    const errs = validateAll();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(errs._sensor || "Please fix the highlighted fields before submitting.");
      return;
    }

    setLoading(true);
    try {
      const rainfallValue = Number(manualForm.rainfall) || 150;

      // Feature order: N, P, K, temperature, humidity, ph, rainfall
      const features = [
        Number(manualForm.nitrogen),
        Number(manualForm.phosphorus),
        Number(manualForm.potassium),
        Number(autoValues.temperature),   // ← Firebase auto
        Number(autoValues.humidity),      // ← Firebase auto
        Number(manualForm.ph),
        rainfallValue,
      ];

      console.log("Features sent to ML:", features);

      const baseUrl = getEnv("VITE_API_BASE_URL") || "http://localhost:5000";
      const res     = await axios.post(`${baseUrl}/predict`, { features });
      const recs    = res.data?.recommendations || [];

      const availablePool = Object.keys(WIKI_TITLES).filter((c) => c !== "coffee");
      const finalCrops    = [];
      const seen          = new Set();

      recs.forEach((item, idx) => {
        let name = item.crop.toLowerCase().trim();
        if (name === "coffee" || seen.has(name)) {
          let pick;
          do { pick = availablePool[Math.floor(Math.random() * availablePool.length)]; }
          while (seen.has(pick));
          name = pick;
        }
        seen.add(name);
        const formatted = name.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        finalCrops.push({ rank: idx + 1, crop: formatted });
      });

      setResults(finalCrops);
      setUsingML(true);
    } catch {
      setResults([
        { rank: 1, crop: "Rice" },
        { rank: 2, crop: "Maize" },
        { rank: 3, crop: "Soybean" },
      ]);
      setUsingML(false);
      setError("ML server unreachable — showing simulation results.");
    } finally {
      setLoading(false);
    }
  };

  // Merged form passed to CropCard for explanation generation
  const combinedForm = {
    ...manualForm,
    temperature: autoValues.temperature,
    humidity:    autoValues.humidity,
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 font-sans antialiased text-slate-800">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-[#1a4d2e] mb-2 tracking-tight uppercase">
          Smart Crop Recommendation
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Temperature &amp; humidity fetched automatically from ESP32 via Firebase.
          Enter remaining soil parameters manually.
        </p>
      </header>

      {/* ── Sensor Status Bar ───────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full
            ${sensorLoading
              ? "bg-yellow-400 animate-pulse"
              : sensorConnected
                ? "bg-emerald-500 animate-pulse"
                : "bg-red-400"}`}
          />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {sensorLoading ? "Connecting…" : sensorConnected ? "ESP32 Sensor Active" : "Sensor Offline"}
          </span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Manual Input Mode
          </span>
        </div>
      </div>

      {/* ── Main Form Card ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800">Field Parameters</h2>
            <button
              type="button"
              onClick={handleClearManual}
              className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors"
            >
              ✕ Clear All
            </button>
          </div>

          {/* ── AUTO: Temperature & Humidity ─────────────────────────────── */}
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2">
               Auto-fetched from ESP32 via Firebase
            </p>
            <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
              <AutoReadField label="Temperature" value={autoValues.temperature} unit="°C" loading={sensorLoading} />
              <AutoReadField label="Humidity"    value={autoValues.humidity}    unit="%" loading={sensorLoading} />
            </div>
            {!sensorConnected && !sensorLoading && (
              <p className="mt-2 text-xs text-red-500 font-medium">
                 ESP32 offline — temperature &amp; humidity unavailable. Check sensor connection.
              </p>
            )}
          </div>

          {/* ── MANUAL: N, P, K, pH (2-col grid) ────────────────────────── */}
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
               Manual Input — Soil Test Values
            </p>
            <div className="grid grid-cols-2 gap-4">
              {["nitrogen", "phosphorus", "potassium", "ph"].map((key) => (
                <ConstrainedField
                  key={key}
                  fieldKey={key}
                  value={manualForm[key]}
                  onChange={handleManualChange}
                  error={fieldErrors[key]}
                />
              ))}
            </div>
          </div>

          {/* ── Rainfall (full width) ────────────────────────────────────── */}
          <div className="mb-5">
            <ConstrainedField
              fieldKey="rainfall"
              value={manualForm.rainfall}
              onChange={handleManualChange}
              error={fieldErrors.rainfall}
            />
          </div>

          {/* ── Constraints legend ───────────────────────────────────────── */}
          <div className="mb-5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Input Constraints</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {[
                ["N",        "0 – 140 mg/kg"],
                ["P",        "0 – 145 mg/kg"],
                ["K",        "0 – 205 mg/kg"],
                ["pH",       "3.0 – 10.0"],
                ["Rainfall", "0 – 300 mm"],
                ["Temp",     "0 – 50°C (Auto)"],
                ["Humidity", "0 – 100% (Auto)"],
              ].map(([f, r]) => (
                <span key={f} className="text-[10px] text-slate-500">
                  <span className="font-bold text-slate-600">{f}:</span> {r}
                </span>
              ))}
            </div>
          </div>

          {/* ── Global error message ─────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Submit button ────────────────────────────────────────────── */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            className="w-full py-4 bg-[#2d8a5b] text-white rounded-full font-bold text-sm
              hover:bg-[#24704a] focus:outline-none focus:ring-2 focus:ring-[#2d8a5b]/50
              disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Running ML Model…
              </span>
            ) : "Get Crop Recommendation"}
          </motion.button>
        </div>
      </form>

      {/* ── Crop Result Cards ──────────────────────────────────────────────── */}
      <div className="mt-16 space-y-10">
        <AnimatePresence>
          {results.map((item) => (
            <CropCard
              key={item.crop + item.rank}
              item={item}
              usingML={usingML}
              form={combinedForm}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}