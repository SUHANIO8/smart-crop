import axios from 'axios';

const getBaseUrl = () => import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

export const predictService = {
  /**
   * Calls the real Flask ML model at /predict
   * Feature order: N, P, K, temperature, humidity, ph, rainfall
   * Returns: { recommendations: [{rank, crop, confidence}] }
   */
  async getCropRecommendation({ nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall }) {
    const features = [
      Number(nitrogen),
      Number(phosphorus),
      Number(potassium),
      Number(temperature),
      Number(humidity),
      Number(ph),
      Number(rainfall),
    ];

    const response = await axios.post(
      `${getBaseUrl()}/predict`,
      { features },
      {
        timeout: 8000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    // Flask returns: { status, total_recommendations, recommendations: [{rank, crop, confidence}] }
    return response.data;
  },
};