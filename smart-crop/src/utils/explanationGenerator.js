

export const generateExplanation = (crop, inputs) => {
  const { temperature, humidity, ph, rainfall } = inputs;

  const reasons = [];

  if (rainfall > 200) reasons.push("high rainfall");
  if (humidity > 60) reasons.push("high humidity");
  if (temperature >= 20 && temperature <= 30)
    reasons.push("suitable temperature");
  if (ph >= 6 && ph <= 7.5) reasons.push("balanced soil pH");

  if (reasons.length === 0) {
    return `${crop} is recommended based on overall soil and weather conditions.`;
  }

  return `${crop} is recommended because of ${reasons.join(", ")}.`;
};
