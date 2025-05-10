import axios from 'axios';

// Server API base URL - adjust if your server is running on a different port or host
const SERVER_API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080/api';

/**
 * Australian locations for the map, with station IDs for direct BOM API access
 */
export const australianLocations = []; // THIS IS OLD LOCATIONS THAT WERE DISPLAYED. WE WILL NOT USE THIS FOR NOW. IN THE FUTURE IT WILL HAVE THE STATION SELECTED BY THE USER

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
 * @param {Date|string} [date] - Optional date to filter stations that have data available on that date
 * @returns {Promise} Promise with array of stations in the SA4 boundary
 */
export const fetchStationsBySA4 = async (code, date) => {
  try {
    let url = `${SERVER_API_URL}/boundaries/sa4/${code}/stations`;
    let params = {};
    
    // Add date parameter if provided
    if (date) {
      // Format date as YYYY-MM-DD if it's a Date object
      const formattedDate = date instanceof Date 
        ? date.toISOString().split('T')[0] 
        : date;
      params.date = formattedDate;
    }
    
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching stations for SA4 code ${code}:`, error);
    return [];
  }
};

/**
 * Fetches rainfall data for all stations in a specific SA4 area
 * @param {string} code - The SA4 code to fetch rainfall data for
 * @param {string} date - The date to get rainfall data for (YYYY-MM-DD)
 * @param {string} startDate - Optional start date for a date range (YYYY-MM-DD)
 * @param {string} endDate - Optional end date for a date range (YYYY-MM-DD)
 * @returns {Promise} Promise with array of stations with their rainfall data
 */
export const fetchAverageRainfallBySA4 = async (code, date, startDate, endDate) => {
  try {
    let url = `${SERVER_API_URL}/rainfall/sa4/${code}`;
    let params = {};
    
    // Either use a single date or a date range
    if (date) {
      params.date = date;
    } else if (startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    } else {
      throw new Error('Either date or both startDate and endDate must be provided');
    }
    
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching rainfall data for SA4 code ${code}:`, error);
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

/**
 * Fetches weather data for a specific station on a given date
 * @param {string|number} stationId - The station ID to fetch data for
 * @param {Date|string} date - The date to get data for (Date object or YYYY-MM-DD string)
 * @returns {Promise} Promise with weather data for the station on the specified date
 */
export const fetchStationWeather = async (stationId, date) => {
  try {
    // Add leading zero to stationId if it's less than 6 digits
    const formattedStationId = stationId.toString().padStart(6, '0');

    // Format date as YYYY-MM-DD if it's a Date object
    const formattedDate = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : date;
    
    console.log('CLIENT SERVICE: Fetching weather data for station:', formattedStationId, 'on date:', formattedDate);
    const url = `${SERVER_API_URL}/rainfall/station/${formattedStationId}/date/${formattedDate}`;
    const response = await axios.get(url);
    console.log('CLIENT SERVICE: Response:', response.data);
    
    // Check if response is empty or invalid
    if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
      console.log('No data found for this station and date');
      return [null, [null, null]]; // Return nulls with the expected array structure
    }
    
    // Check if response.data is an array and extract the first item if it exists
    const data = Array.isArray(response.data) && response.data.length > 0 
      ? response.data[0] 
      : response.data;
    
    // Extract rainfall and temperature values and convert to float if they exist
    const rainfallData = data && data.rainfall !== undefined && data.rainfall !== null
      ? parseFloat(data.rainfall) 
      : null;
    
    const minTemp = data && data.min_temp !== undefined && data.min_temp !== null
      ? parseFloat(data.min_temp)
      : null;
      
    const maxTemp = data && data.max_temp !== undefined && data.max_temp !== null
      ? parseFloat(data.max_temp)
      : null;
    
    // Return rainfall data and temperature data as an array [rainfall, [minTemp, maxTemp]]
    return [rainfallData, [minTemp, maxTemp]];
  } catch (error) {
    console.error(`Error fetching weather data for station ${stationId}:`, error);
    // Return nulls with the expected structure instead of just null
    return [null, [null, null]];
  }
};

/**
 * Fetches weather data for a specific station on a given date range
 * @param {string|number} stationId - The station ID to fetch data for
 * @param {Date|string} startDate - The start date to get data for (Date object or YYYY-MM-DD string)
 * @param {Date|string} endDate - The end date to get data for (Date object or YYYY-MM-DD string)
 * @returns {Promise} Promise with weather data for the station on the specified date range
 */
export const fetchStationWeatherRange = async (stationId, startDate, endDate) => {
  try {
    // Add leading zero to stationId if it's less than 6 digits
    const formattedStationId = stationId.toString().padStart(6, '0');

    // Format dates as YYYY-MM-DD if they're Date objects
    const formattedStartDate = startDate instanceof Date 
      ? startDate.toISOString().split('T')[0] 
      : startDate;
    
    const formattedEndDate = endDate instanceof Date 
      ? endDate.toISOString().split('T')[0] 
      : endDate;
    
    console.log('CLIENT SERVICE: Fetching weather data for station:', formattedStationId, 'on date range:', formattedStartDate, 'to', formattedEndDate);
    const url = `${SERVER_API_URL}/rainfall/station/${formattedStationId}/date/${formattedStartDate}/end_date/${formattedEndDate}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching weather data for station ${stationId} on date range ${startDate} to ${endDate}:`, error);
    return [];
  }
};


/**
 * Fetches temperature data for a specific station on a given date
 * @param {string|number} stationId - The station ID to fetch data for
 * @param {Date|string} date - The date to get data for (Date object or YYYY-MM-DD string)
 * @returns {Promise} Promise with temperature data for the station on the specified date
 */
export const fetchStationTemperature = async (stationId, date) => {
  try {
    // Add leading zero to stationId if it's less than 6 digits
    const formattedStationId = stationId.toString().padStart(6, '0');

    // Format date as YYYY-MM-DD if it's a Date object
    const formattedDate = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : date;
    
    console.log('CLIENT SERVICE: Fetching temperature data for station:', formattedStationId, 'on date:', formattedDate);
    // const url = `${SERVER_API_URL}/temperature/station/${stationId}/date/${formattedDate}`;
    const url = `${SERVER_API_URL}/rainfall/station/${formattedStationId}/date/${formattedDate}`;
    const response = await axios.get(url);
    // Check if response.data is an array and extract the first item if it exists
    const data = Array.isArray(response.data) && response.data.length > 0 
      ? response.data[0]
      : response.data;
    
    // Extract min and max temp value and convert to float if it exists
    const maxTempData = data && data.max_temp !== undefined 
      ? parseFloat(data.max_temp) 
      : null;
    const minTempData = data && data.min_temp !== undefined 
      ? parseFloat(data.min_temp) 
      : null;
    return [minTempData, maxTempData];
  
  } catch (error) {
    console.error(`Error fetching temperature data for station ${stationId}:`, error);
    return null;
  }
}; 

/**
 * Fetches average weather data for all SA4 areas on a given month, year
 * @param {string} month - The month to get weather data for (MM)
 * @param {string} year - The year to get weather data for (YYYY)
 * @returns {Promise} Promise with array of SA4 boundaries and their weather data (including rainfall and temperature)
 */
export const fetchAverageWeatherBySA4 = async (month, year) => {
  try {
    console.log('CLIENT SERVICE: Fetching average weather data for month:', month, 'year:', year);
    const url = `${SERVER_API_URL}/rainfall/sa4/month/${month}/year/${year}`;
    const response = await axios.get(url);
    
    // Check if response is empty or invalid
    if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
      console.log('No weather data found for this month and year');
      return [];
    }
    
    // Process the data to ensure all temperature values are properly parsed
    const processedData = Array.isArray(response.data) 
      ? response.data.map(item => ({
          ...item,
          rainfall: item.rainfall !== undefined && item.rainfall !== null 
            ? parseFloat(item.rainfall) 
            : null,
          min_temp: item.min_temp !== undefined && item.min_temp !== null 
            ? parseFloat(item.min_temp) 
            : null,
          max_temp: item.max_temp !== undefined && item.max_temp !== null 
            ? parseFloat(item.max_temp) 
            : null
        }))
      : [];
      
    return processedData;
  } catch (error) {
    console.error('Error fetching average weather data for SA4:', error);
    return [];
  }
};

/**
 * Searches for weather stations based on a search term
 * @param {string} searchTerm - The search term to look for stations
 * @returns {Promise} Promise with array of matching stations
 */
export const searchWeatherStations = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }
    
    const trimmedTerm = searchTerm.trim();
    
    // Format query - if it's numeric, ensure we're sending a properly formatted ID
    let queryParam = trimmedTerm;
    
    // Check if it's a numeric ID - if so, ensure we don't have leading zeros interfering
    if (/^\d+$/.test(trimmedTerm)) {
      // For numeric searches, we'll let the server handle the exact matching logic
      // But we'll log that we're specifically searching for a station ID
      console.log('CLIENT SERVICE: Searching for stations with numeric ID:', trimmedTerm);
    } else {
      console.log('CLIENT SERVICE: Searching for stations with term:', trimmedTerm);
    }
    
    const url = `${SERVER_API_URL}/stations/search`;
    const response = await axios.get(url, { 
      params: { 
        query: queryParam
      } 
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      console.log('No stations found or invalid response format');
      return [];
    }
    
    console.log(`Found ${response.data.length} stations matching "${trimmedTerm}"`);
    return response.data;
  } catch (error) {
    console.error(`Error searching for stations with term "${searchTerm}":`, error);
    return [];
  }
};
export async function fetchAverageWeatherByRect(bounds) {
  const [minLat, maxLat, minLng, maxLng] = bounds;
  
  console.log('CLIENT SERVICE: Fetching average weather data within [', minLat, maxLat, minLng, maxLng, ']');
  const url = `${SERVER_API_URL}/boundaries/rect/${minLat}/${maxLat}/${minLng}/${maxLng}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching average weather:', error);
    return [];
  }
}
