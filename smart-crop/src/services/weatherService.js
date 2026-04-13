import axios from 'axios';

/**
 * Open-Meteo Service
 * 1. Geocodes the city name to get Latitude/Longitude.
 * 2. Fetches current weather and 30-day historical rain data.
 * 3. Calculates the daily average rainfall.
 */
export const weatherService = {
  async getWeatherData(city) {
    try {
      // --- Step 1: Geocoding (City Name -> Coordinates) ---
      const geoResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        params: {
          name: city,
          count: 1,
          language: 'en',
          format: 'json'
        }
      });

      if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
        throw new Error(`City "${city}" not found. Please check the spelling.`);
      }

      const { latitude, longitude, name } = geoResponse.data.results[0];

      // --- Step 2: Weather & Rainfall Data ---
      const weatherResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude,
          longitude,
          current: ['temperature_2m', 'relative_humidity_2m'],
          daily: ['precipitation_sum'],
          past_days: 30, // Fetches last 30 days of data
          forecast_days: 1,
          timezone: 'auto'
        },
        timeout: 10000,
      });

      const { current, daily } = weatherResponse.data;

      // --- Step 3: Calculate Average Rainfall ---
      // We sum the rainfall from the last 30 days and divide by 30
      const rainHistory = daily.precipitation_sum || [];
      const totalRain = rainHistory.reduce((sum, val) => sum + (val || 0), 0);
      const averageRain = rainHistory.length > 0 ? (totalRain / rainHistory.length) : 0;

      return {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        // averageRain is daily mm over the month. 
        // If your app expects "Total Monthly Rain", use totalRain instead.
        rainfall: parseFloat(averageRain.toFixed(2)), 
        city: name,
      };

    } catch (err) {
      // Detailed error logging
      if (err.response) {
        throw new Error(`Weather API Error: ${err.response.status}`);
      }
      
      if (err.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please check your connection.');
      }

      throw new Error(err.message || 'Failed to fetch weather data.');
    }
  },
};