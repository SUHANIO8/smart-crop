import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const getEnv = (key, fallback) => {
  try {
    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
    return env[key] || fallback;
  } catch {
    return fallback;
  }
};

const firebaseConfig = {
  apiKey:            getEnv("VITE_FIREBASE_API_KEY",            "AIzaSyBT-crmUL-3-vG7pcUtnNdnC7lQTYMZ3Tg"),
  authDomain:        getEnv("VITE_FIREBASE_AUTH_DOMAIN",        "crop-recommendation-f8a69.firebaseapp.com"),
  databaseURL:       getEnv("VITE_FIREBASE_DATABASE_URL",       "https://crop-recommendation-f8a69-default-rtdb.asia-southeast1.firebasedatabase.app"),
  projectId:         getEnv("VITE_FIREBASE_PROJECT_ID",         "crop-recommendation-f8a69"),
  storageBucket:     getEnv("VITE_FIREBASE_STORAGE_BUCKET",     "crop-recommendation-f8a69.firebasestorage.app"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID","79378848532"),
  appId:             getEnv("VITE_FIREBASE_APP_ID",             "1:79378848532:web:fae430e620a545c7e34001"),
  measurementId:     getEnv("VITE_FIREBASE_MEASUREMENT_ID",     "G-PZQPGW8F8X"),
};

const app = initializeApp(firebaseConfig);

// Explicitly pass databaseURL to connect to asia-southeast1 regional instance
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);