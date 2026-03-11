// src/utils/cropMeta.js
// BUG FIX: Removed broken local image import (../assets/crops/default.jpg)
// Using a reliable Unsplash fallback URL instead

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1000';

export const cropMeta = {
  rice: {
    info: "Rice grows well in water-retentive soil with warm climate.",
  },
  wheat: {
    info: "Wheat prefers cooler climate and moderate rainfall.",
  },
  maize: {
    info: "Maize grows well in well-drained soil and moderate temperature.",
  },
  cotton: {
    info: "Cotton prefers black soil and warm dry climate.",
  },
  sugarcane: {
    info: "Sugarcane requires high rainfall and long growing season.",
  },
  jute: {
    info: "Jute grows well in humid climate with fertile soil.",
  },
  papaya: {
    info: "Papaya prefers well-drained soil and warm temperature.",
  },
  banana: {
    info: "Banana thrives in tropical climate with high humidity.",
  },
  mango: {
    info: "Mango grows well in tropical and subtropical regions.",
  },
  chickpea: {
    info: "Chickpea prefers cool dry weather and well-drained loamy soil.",
  },
  kidneybeans: {
    info: "Kidney beans grow best in moderate temperature with good drainage.",
  },
  blackgram: {
    info: "Blackgram prefers warm humid climate and well-drained soil.",
  },
  lentil: {
    info: "Lentil grows in cool dry climate with loamy or sandy soil.",
  },
  pomegranate: {
    info: "Pomegranate prefers semi-arid climate with well-drained soil.",
  },
  watermelon: {
    info: "Watermelon thrives in warm sunny climate with sandy loam soil.",
  },
  muskmelon: {
    info: "Muskmelon grows best in hot dry weather with well-drained soil.",
  },
  grapes: {
    info: "Grapes prefer warm dry climate with well-drained deep soil.",
  },
  coconut: {
    info: "Coconut thrives in tropical coastal regions with high humidity.",
  },
  orange: {
    info: "Orange grows best in subtropical climate with moderate rainfall.",
  },
};

export const defaultCropMeta = {
  image: FALLBACK_IMG,
  info: "This crop is suitable for the given soil and weather conditions.",
};

// Helper to get crop info by name (case insensitive)
export const getCropInfo = (cropName) => {
  const key = cropName?.toLowerCase().trim();
  return cropMeta[key] || defaultCropMeta;
};