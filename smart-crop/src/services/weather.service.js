import axios from 'axios';

export const weatherService = {
  async getWeatherData(city) {
    // Safely read key
    const API_KEY = import.meta.env?.VITE_WEATHER_API_KEY || '';

    if (!API_KEY) throw new Error('Weather API key not configured in .env');

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q: city,
            units: 'metric',
            appid: API_KEY,
          },
          timeout: 8000, // fail fast
        }
      );

      const data = response.data;
      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        rainfall: data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0,
        city: data.name,
      };
    } catch {
      throw new Error('City not found. Please try again.');
    }
  }
};