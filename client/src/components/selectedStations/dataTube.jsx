import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * DataTube Component
 * A reusable component for displaying rainfall or temperature data as vertical tubes
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - The label to display above the tube
 * @param {number|string} props.value - The value to display below the tube
 * @param {string} props.unit - The unit of measurement (e.g., 'mm', '°C')
 * @param {number} props.fillPercentage - The percentage the tube should be filled (0-100)
 * @param {string} props.fillColor - The color to use for the fill
 * @param {boolean} props.loading - Whether the data is loading
 * @param {boolean} props.isTemperatureTube - Whether this is a temperature tube (uses range instead of fill)
 * @param {boolean} props.isThermometerTube - Whether this is a thermometer tube (displays single temp value on -20 to 50°C scale)
 * @param {number} props.minPercentage - For temperature tube, the percentage for min temp
 * @param {number} props.maxPercentage - For temperature tube, the percentage for max temp
 * @param {number} props.width - Width of the column (default: 70px)
 * @param {number} props.height - Height of the tube (default: 90px)
 */
const DataTube = ({ 
  label,
  value,
  unit = 'mm',
  fillPercentage = 0,
  fillColor = 'rgb(0, 106, 255)',
  loading = false,
  isTemperatureTube = false,
  isThermometerTube = false,
  minPercentage = 0,
  maxPercentage = 0,
  width = 70,
  height = 90
}) => {
  // Calculate actual temperature values for display and positioning
  const getTemperatureValues = () => {
    if (!isTemperatureTube || typeof value !== 'object') {
      return { min: null, max: null };
    }
    
    const min = typeof value.min === 'number' ? value.min : 
               (typeof value.min === 'string' ? parseFloat(value.min) : null);
    
    const max = typeof value.max === 'number' ? value.max : 
               (typeof value.max === 'string' ? parseFloat(value.max) : null);
    
    return { min, max };
  };
  
  // Get temp values for internal calculations
  const { min: minTemp, max: maxTemp } = getTemperatureValues();
  
  // Get single temperature value for thermometer display
  const getSingleTemperatureValue = () => {
    if (!isThermometerTube) return null;
    
    // For thermometer tube, value should be a number or a string that can be parsed to a number
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    
    return null;
  };
  
  const singleTempValue = getSingleTemperatureValue();
  
  // Calculate temperature positions (0% is bottom, 100% is top)
  // Map from -20°C to 50°C (range of 70 degrees)
  const calculateTempPosition = (temp) => {
    if (temp === null || temp === undefined || isNaN(temp)) return 0;
    
    // If temperature is below -20°C, cap at 0%
    if (temp <= -20) return 0;
    // If temperature is above 50°C, cap at 100%
    if (temp >= 50) return 100;
    // Otherwise, scale from -20 to 50 (range of 70 degrees)
    return ((temp + 20) / 70) * 100;
  };
  
  // Calculate thermometer position (height) based on temperature
  const thermometerHeight = singleTempValue !== null ? calculateTempPosition(singleTempValue) : 0;
  
  // Calculate correct positions
  const minTempPosition = calculateTempPosition(minTemp);
  const maxTempPosition = calculateTempPosition(maxTemp);
  
  // Get color based on temperature value
  const getColorForTemperature = (temp) => {
    // Temperature scale from -20°C to 40°C
    if (temp <= -20) return 'rgb(135, 206, 250)';  // Light sky blue
    if (temp <= -5) return 'rgb(135, 206, 250)';   // Light sky blue
    if (temp <= 5) return 'rgb(144, 238, 144)';    // Light green
    if (temp <= 10) return 'rgb(144, 238, 144)';   // Light green
    if (temp <= 20) return 'rgb(255, 255, 0)';     // Yellow
    if (temp <= 30) return 'rgb(255, 165, 0)';     // Orange
    return 'rgb(178, 34, 34)';                     // Dark red (> 30°C)
  };
  
  // Calculate gradient colors specific to this temperature range
  const getDynamicTemperatureGradient = () => {
    if (minTemp === null || maxTemp === null) return 'transparent';
    
    // Get the colors for the min and max temperatures
    const minColor = getColorForTemperature(minTemp);
    const maxColor = getColorForTemperature(maxTemp);
    
    // If the min and max are in the same color range, we need a slight variation
    // to make the gradient visible
    if (minColor === maxColor) {
      // For single-color ranges, create a subtle variation
      return `linear-gradient(to top, 
        ${minColor} 0%,
        ${minColor} 100%)`;
    }
    
    // If there's a significant range spanning multiple color regions
    // Create a gradient with just the colors needed for this specific range
    if (Math.abs(maxTemp - minTemp) > 10) {
      // For wider ranges, add intermediate color stops if needed
      const midTemp = (minTemp + maxTemp) / 2;
      const midColor = getColorForTemperature(midTemp);
      
      return `linear-gradient(to top, 
        ${minColor} 0%,
        ${midColor} 50%,
        ${maxColor} 100%)`;
    }
    
    // For smaller ranges between two color regions
    return `linear-gradient(to top, 
      ${minColor} 0%,
      ${maxColor} 100%)`;
  };
  
  // Format display value
  const displayValue = () => {
    if (loading) return '-';
    if (value === 'No data' || value === null || value === undefined) return 'No data';
    
    // For thermometer tube, handle single temperature value
    if (isThermometerTube && singleTempValue !== null && !isNaN(singleTempValue)) {
      return `${parseFloat(singleTempValue).toFixed(1)}${unit}`;
    }
    
    // For temperature tube, we need to handle min/max values
    if (isTemperatureTube && typeof value === 'object') {
      const min = value.min;
      const max = value.max;
      
      // Check if either value is NaN, null, undefined, or "No data"
      if (!min && !max) {
        return 'No data';
      }
      
      if (min !== null && max !== null && !isNaN(min) && !isNaN(max)) {
        return `${parseFloat(min).toFixed(1)}${unit} to ${parseFloat(max).toFixed(1)}${unit}`;
      } else if (min !== null && !isNaN(min)) {
        return `${parseFloat(min).toFixed(1)}${unit}`;
      } else if (max !== null && !isNaN(max)) {
        return `${parseFloat(max).toFixed(1)}${unit}`;
      }
      
      return 'No data';
    }
    
    // For rainfall tube
    if (typeof value === 'number' && !isNaN(value)) {
      return `${parseFloat(value).toFixed(1)}${unit}`;
    }
    
    return 'No data';
  };

  // Check if the value is valid for display
  const hasValidValue = displayValue() !== 'No data';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${width}px` }}>
      {label && (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ 
          mb: 1.5,
          fontSize: '0.85rem',
          height: '2.5em', // Fixed height for label area that can fit two lines
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1.2
        }}>
          {label}
        </Typography>
      )}
      <Box sx={{ 
        position: 'relative', 
        width: '35px', 
        height: `${height}px`, 
        border: '1px solid #ddd', 
        borderRadius: 1,
        bgcolor: '#fff',
        overflow: 'hidden'
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={16} />
          </Box>
        ) : isThermometerTube ? (
          // Thermometer visualization - simple tube with red color
          <Box sx={{ 
            position: 'absolute', 
            bottom: 0, 
            width: '100%', 
            height: `${thermometerHeight}%`, 
            bgcolor: '#d30000', // Thermometer red color
            transition: 'height 0.5s ease-in-out'
          }} />
        ) : isTemperatureTube ? (
          // Temperature range visualization with dynamic gradient
          <Box sx={{ 
            position: 'absolute', 
            bottom: `${minTempPosition}%`, 
            width: '100%', 
            height: `${Math.max(0, maxTempPosition - minTempPosition)}%`, 
            background: getDynamicTemperatureGradient(),
            display: (minTemp !== null || maxTemp !== null) ? 'block' : 'none',
            transition: 'all 0.5s ease-in-out'
          }} />
        ) : (
          // Rainfall visualization
          <Box sx={{ 
            position: 'absolute', 
            bottom: 0, 
            width: '100%', 
            height: `${fillPercentage}%`, 
            bgcolor: fillColor,
            transition: 'height 0.5s ease-in-out'
          }} />
        )}
      </Box>
      {/* Always render the Typography component to maintain consistent height, but show empty content for 'No data' */}
      <Typography variant="caption" color="text.secondary" align="center" sx={{ 
        mt: 0.5, 
        fontSize: '0.75rem',
        height: '1.25em', // Set a fixed height for consistent spacing
        display: label ? 'block' : 'none', // Only show if there's a label above
        visibility: hasValidValue ? 'visible' : 'hidden' // Hide text but maintain space
      }}>
        {displayValue()}
      </Typography>
    </Box>
  );
};

export default DataTube; 