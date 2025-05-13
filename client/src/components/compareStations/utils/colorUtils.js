/**
 * Utility functions for color management in the station comparison tools
 */

// Track assigned colors to each station
const stationColorMap = new Map();
let colorIndex = 0;

/**
 * Generate a consistent color for each station ID
 * @param {String|Number} stationId - The station ID
 * @returns {String} - A HEX color code
 */
export const getStationColor = (stationId) => {
  // Predefined color palette with distinct colors
  const colorPalette = [
    '#1f77b4', // blue
    '#ff7f0e', // orange
    '#2ca02c', // green
    '#d62728', // red
    '#9467bd'  // purple
  ];
  
  // Handle missing stationId
  if (!stationId) {
    return colorPalette[0];
  }
  
  // If this station already has an assigned color, return it
  if (stationColorMap.has(stationId)) {
    return stationColorMap.get(stationId);
  }
  
  // Assign the next available color
  const color = colorPalette[colorIndex % colorPalette.length];
  colorIndex++;
  
  // Store the color assignment
  stationColorMap.set(stationId, color);
  
  return color;
};

/**
 * Get the color palette used for stations
 * @returns {Array} - Array of HEX color codes
 */
export const getColorPalette = () => {
  return [
    '#1f77b4', // blue
    '#ff7f0e', // orange
    '#2ca02c', // green
    '#d62728', // red
    '#9467bd'  // purple
  ];
}; 