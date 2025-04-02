/**
 * Boundaries API Services
 * Handles requests for geographical boundary data
 */

// API Base URL - read from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Fetch all SA4 boundaries as GeoJSON
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export const fetchSA4Boundaries = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/boundaries/sa4`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch SA4 boundaries: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching SA4 boundaries:', error);
    throw error;
  }
};

/**
 * Fetch a specific SA4 boundary by its code
 * @param {string} code - The SA4 code (e.g., "101")
 * @returns {Promise<Object>} GeoJSON Feature
 */
export const fetchSA4BoundaryByCode = async (code) => {
  try {
    const response = await fetch(`${API_BASE_URL}/boundaries/sa4/${code}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch SA4 boundary: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching SA4 boundary code=${code}:`, error);
    throw error;
  }
}; 