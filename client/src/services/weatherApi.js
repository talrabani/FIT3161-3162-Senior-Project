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
 * Fetches rainfall data for all stations in a specific SA4 area
 * @param {string} code - The SA4 code to fetch rainfall data for
 * @param {string} date - The date to get rainfall data for (YYYY-MM-DD)
 * @param {string} startDate - Optional start date for a date range (YYYY-MM-DD)
 * @param {string} endDate - Optional end date for a date range (YYYY-MM-DD)
 * @returns {Promise} Promise with array of stations with their rainfall data
 */
export const fetchRainfallBySA4 = async (code, date, startDate, endDate) => {
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