/**
 * Utility functions for color management in the station comparison tools
 */

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
    '#9467bd', // purple
    '#8c564b', // brown
    '#e377c2', // pink
    '#7f7f7f', // gray
    '#bcbd22', // olive
    '#17becf', // teal
    '#aec7e8', // light blue
    '#ffbb78', // light orange
    '#98df8a', // light green
    '#ff9896', // light red
    '#c5b0d5'  // light purple
  ];
  
  // Handle missing stationId
  if (!stationId) {
    return colorPalette[0];
  }
  
  // Use the station ID to pick a consistent color from the palette
  const hash = stationId.toString().split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Use modulo to get an index within the palette range
  const colorIndex = hash % colorPalette.length;
  
  return colorPalette[colorIndex];
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
    '#9467bd', // purple
    '#8c564b', // brown
    '#e377c2', // pink
    '#7f7f7f', // gray
    '#bcbd22', // olive
    '#17becf', // teal
    '#aec7e8', // light blue
    '#ffbb78', // light orange
    '#98df8a', // light green
    '#ff9896', // light red
    '#c5b0d5'  // light purple
  ];
}; 