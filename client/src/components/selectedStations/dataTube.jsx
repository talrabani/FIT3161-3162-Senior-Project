import React from 'react';
import { Box, Typography, Tooltip, CircularProgress } from '@mui/material';

/**
 * DataTube Component
 * Displays a tube-like visualization for weather data
 * 
 * @param {string|Object} value - The value to display (number or {min, max} for temperature)
 * @param {string} unit - The unit of measurement (e.g., 'mm', '°C')
 * @param {string} label - Optional label for the tube
 * @param {number} fillPercentage - Percentage to fill the tube (0-100)
 * @param {number} minPercentage - For temp tube, min temp fill percentage
 * @param {number} maxPercentage - For temp tube, max temp fill percentage
 * @param {string} fillColor - Color for the fill
 * @param {boolean} isTemperatureTube - Whether this is a temperature display with min/max
 * @param {boolean} isThermometerTube - Whether this is a simple thermometer display
 * @param {boolean} loading - Whether data is currently loading
 * @param {number} width - Width of the tube container in px
 * @param {function} formatValue - Function to format the value with appropriate units
 */
const DataTube = ({
  value,
  unit = '',
  label = '',
  fillPercentage = 0,
  minPercentage = 0,
  maxPercentage = 0,
  fillColor = '#006aff',
  isTemperatureTube = false,
  isThermometerTube = false,
  loading = false,
  width = 70,
  formatValue = null
}) => {
  // Height of the tube in pixels
  const tubeHeight = 180;
  const tubeWidth = Math.min(width * 0.6, 40);
  
  // Process the value for display
  const displayValue = () => {
    if (loading) return <CircularProgress size={16} />;
    
    // If a custom format function is provided, use it
    if (formatValue) {
      if (isTemperatureTube && typeof value === 'object') {
        const minVal = formatValue(value.min);
        const maxVal = formatValue(value.max);
        
        // If either value is 'No data', return 'No data'
        if (minVal === 'No data' || maxVal === 'No data') {
          return 'No data';
        }
        
        // Extract just the numbers without the units for display in the tube
        // This assumes formatValue returns strings like "23.5°C" or "74.3°F"
        const minDisplay = minVal.replace(/[^0-9.-]/g, '');
        const maxDisplay = maxVal.replace(/[^0-9.-]/g, '');
        
        return `${minDisplay} - ${maxDisplay}`;
      } else {
        const formattedVal = formatValue(value);
        
        // If the value is 'No data', return as is
        if (formattedVal === 'No data') return formattedVal;
        
        // Otherwise, extract just the number without the unit for display in the tube
        return formattedVal.replace(/[^0-9.-]/g, '');
      }
    }
    
    // Default handling if no formatValue function is provided
    if (isTemperatureTube && typeof value === 'object') {
      if (value.min === 'No data' || value.max === 'No data') return 'No data';
      
      const minVal = typeof value.min === 'number' ? value.min.toFixed(1) : value.min;
      const maxVal = typeof value.max === 'number' ? value.max.toFixed(1) : value.max;
      
      return `${minVal} - ${maxVal}`;
    }
    
    if (value === 'No data' || value === null || value === undefined) return 'No data';
    
    return typeof value === 'number' ? value.toFixed(1) : value;
  };
  
  // Get the full display value with units for tooltip
  const getTooltipValue = () => {
    if (loading) return 'Loading...';
    
    if (formatValue) {
      if (isTemperatureTube && typeof value === 'object') {
        const minVal = formatValue(value.min);
        const maxVal = formatValue(value.max);
        return minVal === 'No data' || maxVal === 'No data' ? 'No data' : `${minVal} - ${maxVal}`;
      } else {
        return formatValue(value);
      }
    }
    
    if (isTemperatureTube && typeof value === 'object') {
      if (value.min === 'No data' || value.max === 'No data') return 'No data';
      
      const minVal = typeof value.min === 'number' ? value.min.toFixed(1) : value.min;
      const maxVal = typeof value.max === 'number' ? value.max.toFixed(1) : value.max;
      
      return `${minVal}${unit} - ${maxVal}${unit}`;
    }
    
    if (value === 'No data' || value === null || value === undefined) return 'No data';
    
    return typeof value === 'number' ? `${value.toFixed(1)}${unit}` : value;
  };
  
  // If this is a thermometer tube (simple thermometer display)
  if (isThermometerTube) {
    return (
      <Tooltip title={getTooltipValue()} arrow placement="top">
        <Box sx={{ 
          width: width, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Box sx={{ 
            width: tubeWidth / 2, 
            height: tubeHeight * 0.6,
            borderRadius: `${tubeWidth / 4}px ${tubeWidth / 4}px 0 0`,
            border: '2px solid #ccc',
            borderBottom: 'none',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5'
          }}>
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: `${fillPercentage}%`,
              backgroundColor: value < 0 ? '#6baff9' : '#ff7761',
              transition: 'height 0.5s ease-out',
            }} />
          </Box>
          <Box sx={{ 
            width: tubeWidth,
            height: tubeWidth,
            borderRadius: '50%',
            border: '2px solid #ccc',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            marginTop: '-1px',
            position: 'relative'
          }}>
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: '100%',
              backgroundColor: value < 0 ? '#6baff9' : '#ff7761',
              clipPath: `polygon(0 ${100 - fillPercentage}%, 100% ${100 - fillPercentage}%, 100% 100%, 0% 100%)`,
              transition: 'height 0.5s ease-out',
            }} />
          </Box>
          <Typography variant="caption" sx={{ mt: 1, fontSize: '0.7rem', textAlign: 'center' }}>
            {displayValue()}
          </Typography>
        </Box>
      </Tooltip>
    );
  }
  
  // Regular data tube or temperature tube
  return (
    <Tooltip title={getTooltipValue()} arrow placement="top">
      <Box sx={{ 
        width: width, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {label && (
          <Typography variant="caption" sx={{ mb: 1, fontSize: '0.7rem', textAlign: 'center', height: '24px' }}>
            {label}
          </Typography>
        )}
        <Box sx={{ 
          width: tubeWidth, 
          height: tubeHeight,
          borderRadius: tubeWidth / 2,
          border: '2px solid #ccc',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#f5f5f5'
        }}>
          {isTemperatureTube ? (
            <>
              {/* Min-Max temperature visualization */}
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: `${minPercentage}%`,
                backgroundColor: fillColor,
                transition: 'height 0.5s ease-out',
              }} />
              <Box sx={{
                position: 'absolute',
                bottom: `${minPercentage}%`,
                width: '100%',
                height: `${maxPercentage - minPercentage}%`,
                background: `repeating-linear-gradient(
                  -45deg,
                  ${fillColor},
                  ${fillColor} 5px,
                  rgba(255,255,255,0.7) 5px,
                  rgba(255,255,255,0.7) 10px
                )`,
                transition: 'height 0.5s ease-out, bottom 0.5s ease-out',
              }} />
            </>
          ) : (
            // Rainfall visualization
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: `${fillPercentage}%`,
              backgroundColor: fillColor,
              transition: 'height 0.5s ease-out',
            }} />
          )}
        </Box>
        <Typography variant="caption" sx={{ mt: 1, fontSize: '0.7rem', textAlign: 'center' }}>
          {displayValue()}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default DataTube; 