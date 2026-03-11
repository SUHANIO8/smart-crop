import axios from 'axios';

// Replace with the Access Key you copied in Phase 1
const UNSPLASH_ACCESS_KEY = "YOUR_ACTUAL_ACCESS_KEY_HERE";

export const imageService = {
  async getCropImage(cropName) {
    try {
      const response = await axios.get(`https://api.unsplash.com/search/photos`, {
        params: {
          query: `${cropName} crop agriculture`, // Specific query for better results
          per_page: 1,                          // We only need the top result
          orientation: 'landscape',             // Fits your card design better
          client_id: UNSPLASH_ACCESS_KEY
        }
      });

      // Navigate the JSON to get the regular size image URL
      const imageUrl = response.data.results[0]?.urls?.regular;

      // Fallback image if nothing is found
      return imageUrl || 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=1000';
    } catch (error) {
      console.error("Unsplash API Error:", error);
      // Return a default agriculture image if API fails (or rate limit is hit)
      return 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=1000';
    }
  }
};