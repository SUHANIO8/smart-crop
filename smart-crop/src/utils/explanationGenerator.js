// src/utils/explanationGenerator.js

export const generateExplanation = (crop, inputs) => {
  // BUG FIX: Convert to Number() — Firebase data comes as strings,
  // string comparisons like "82" > 60 work in JS but are unreliable
  const temperature = Number(inputs.temperature);
  const humidity    = Number(inputs.humidity);
  const ph          = Number(inputs.ph);
  const rainfall    = Number(inputs.rainfall);
  const nitrogen    = Number(inputs.nitrogen);
  const phosphorus  = Number(inputs.phosphorus);
  const potassium   = Number(inputs.potassium);

  const reasons = [];

  if (rainfall > 200)                         reasons.push("high rainfall availability");
  if (humidity > 60)                          reasons.push("favorable humidity levels");
  if (temperature >= 20 && temperature <= 30) reasons.push("suitable temperature range");
  if (ph >= 6 && ph <= 7.5)                   reasons.push("balanced soil pH");
  if (nitrogen > 80)                          reasons.push("nitrogen-rich soil");
  if (phosphorus > 40)                        reasons.push("adequate phosphorus content");
  if (potassium > 40)                         reasons.push("sufficient potassium levels");

  if (reasons.length === 0) {
    return `${crop} is recommended based on the overall soil nutrient profile and environmental conditions.`;
  }

  return `${crop} is recommended because of ${reasons.join(", ")}.`;
};