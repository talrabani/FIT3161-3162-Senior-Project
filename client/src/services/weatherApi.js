import axios from 'axios';

// BOM API base URLs
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/bom';
// Server API base URL - adjust if your server is running on a different port or host
const SERVER_API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080/api';

// The BOM direct URL might have CORS issues, so we'll only use Open-Meteo API
// const BOM_OBSERVATIONS_URL = 'http://www.bom.gov.au/fwo';

/**
 * Map of Australian states to their BOM product codes for observations
 */
const STATE_PRODUCT_CODES = {
  NSW: 'IDN60901',
  VIC: 'IDV60901',
  QLD: 'IDQ60901',
  SA: 'IDS60901',
  WA: 'IDW60901',
  TAS: 'IDT60901',
  NT: 'IDD60901',
  ACT: 'IDN60903'
};

/**
 * Fetches historical weather data from Open-Meteo API which uses BOM data
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @param {string} startDate - Start date in ISO format (YYYY-MM-DD)
 * @param {string} endDate - End date in ISO format (YYYY-MM-DD)
 * @returns {Promise} Promise with weather data
 */
export const fetchHistoricalWeather = async (latitude, longitude, startDate, endDate) => {
  try {
    const response = await axios.get(OPEN_METEO_URL, {
      params: {
        latitude,
        longitude,
        start_date: startDate,
        end_date: endDate,
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum',
        timezone: 'Australia/Sydney',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching historical weather data:', error);
    // Return a minimal valid data structure instead of throwing
    return {
      daily: {
        time: [],
        temperature_2m_max: [],
        temperature_2m_min: [],
        precipitation_sum: [],
        rain_sum: []
      }
    };
  }
};

/**
 * Simulates current weather observations when direct BOM API is unavailable
 * @param {string} stationId - BOM station ID
 * @param {string} state - Australian state code (NSW, VIC, etc.)
 * @returns {Promise} Promise with simulated observation data
 */
export const fetchCurrentObservations = async (stationId, state) => {
  try {
    // Instead of making a potentially failing request to BOM, 
    // we'll use the forecast data from Open-Meteo
    // This is a workaround for CORS issues with the BOM API
    
    // Use the latitude/longitude of the station to get latest data
    const location = australianLocations.find(loc => loc.stationId === stationId);
    
    if (!location) {
      throw new Error(`No location found for station ID: ${stationId}`);
    }
    
    // Get current forecast as a substitute for current observations
    const forecastResponse = await axios.get(OPEN_METEO_URL, {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        hourly: 'temperature_2m,relative_humidity_2m,precipitation,windspeed_10m,winddirection_10m,pressure_msl',
        forecast_days: 1,
        timezone: 'Australia/Sydney',
      }
    });
    
    // Convert to a format similar to what the BOM API would return
    const currentHour = new Date().getHours();
    const data = forecastResponse.data;
    
    // Format a simulated BOM response
    return {
      data: [{
        name: location.name,
        air_temp: data.hourly.temperature_2m[currentHour],
        rel_hum: data.hourly.relative_humidity_2m[currentHour],
        rain_trace: data.hourly.precipitation[currentHour],
        wind_spd_kmh: data.hourly.windspeed_10m[currentHour],
        wind_dir: convertWindDirection(data.hourly.winddirection_10m[currentHour]),
        press: data.hourly.pressure_msl[currentHour],
        local_date_time_full: new Date().toISOString()
      }]
    };
  } catch (error) {
    console.error('Error fetching weather observations:', error);
    // Return a minimal valid data structure instead of throwing
    return {
      data: []
    };
  }
};

/**
 * Helper function to convert wind direction in degrees to cardinal direction
 * @param {number} degrees - Wind direction in degrees
 * @returns {string} Cardinal direction (N, NE, E, etc.)
 */
function convertWindDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Fetches weather forecast for a specific location
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @returns {Promise} Promise with forecast data
 */
export const fetchWeatherForecast = async (latitude, longitude) => {
  try {
    const response = await axios.get(OPEN_METEO_URL, {
      params: {
        latitude,
        longitude,
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,weathercode',
        forecast_days: 7,
        timezone: 'Australia/Sydney',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    // Return a minimal valid data structure instead of throwing
    return {
      daily: {
        time: [],
        temperature_2m_max: [],
        temperature_2m_min: [],
        precipitation_sum: [],
        rain_sum: [],
        weathercode: []
      }
    };
  }
};

/**
 * Australian locations for the map, with station IDs for direct BOM API access
 */
export const australianLocations = []; // THIS IS OLD LOCATIONS THAT WERE DISPLAYED. WE WILL NOT USE THIS FOR NOW. IN THE FUTURE IT WILL HAVE THE STATION SELECTED BY THE USER

/**
 * Weather condition codes mapping (from Open-Meteo WMO codes)
 */
export const weatherCodes = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

/**
 * Fetches SA4 boundaries as GeoJSON from the server
 * @returns {Promise} Promise with GeoJSON data for SA4 boundaries
 */
export const fetchSA4Boundaries = async () => {
  try {
    const response = await axios.get(`${SERVER_API_URL}/boundaries/sa4`);
    return response.data;
  } catch (error) {
    console.error('Error fetching SA4 boundaries:', error);
    // Return a valid empty GeoJSON structure
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

/**
 * Fetches a specific SA4 boundary by code
 * @param {string} code - The SA4 code to fetch
 * @returns {Promise} Promise with GeoJSON data for the specific SA4 boundary
 */
export const fetchSA4BoundaryByCode = async (code) => {
  try {
    const response = await axios.get(`${SERVER_API_URL}/boundaries/sa4/${code}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching SA4 boundary for code ${code}:`, error);
    // Return a valid empty GeoJSON feature
    return {
      type: 'Feature',
      properties: {},
      geometry: null
    };
  }
};

/**
 * Fetches stations that belong to a specific SA4 boundary
 * @param {string} code - The SA4 code to fetch stations for
 * @returns {Promise} Promise with array of stations in the SA4 boundary
 */
export const fetchStationsBySA4 = async (code) => {
  try {
    const response = await axios.get(`${SERVER_API_URL}/boundaries/sa4/${code}/stations`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching stations for SA4 code ${code}:`, error);
    return [];
  }
};

/**
 * Fetches a summary of SA4 boundaries with station counts
 * @returns {Promise} Promise with array of SA4 boundaries and their station counts
 */
export const fetchSA4Summary = async () => {
  try {
    const response = await axios.get(`${SERVER_API_URL}/boundaries/sa4-summary`);
    return response.data;
  } catch (error) {
    console.error('Error fetching SA4 summary:', error);
    return [];
  }
}; 