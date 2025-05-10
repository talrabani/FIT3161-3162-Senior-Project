import React, { useEffect, useRef } from 'react';
import './MapLegend.css';

/**
 * Map Legend Component
 * Displays a legend for weather data visualization on the map
 * 
 * @param {Object} props
 * @param {number} props.minValue - Minimum value in the data range
 * @param {number} props.maxValue - Maximum value in the data range
 * @param {Function} props.colorScale - Function that maps values to colors
 * @param {string} props.title - Title for the legend
 * @param {string} props.type - Type of data (rainfall, min_temp, max_temp)
 * @param {Date} props.date - Selected date for display
 */
const MapLegend = ({ 
  minValue, 
  maxValue, 
  colorScale, 
  title, 
  type, 
  date
}) => {
  // Format the selected date for display
  const formattedDate = date ? 
    `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}` : 
    'Selected Date';
  
  // For temperature data
  if (type === 'min_temp' || type === 'max_temp') {
    // Create gradient stops for the legend
    const stops = [-20, -10, 0, 10, 20, 30, 40, 50];
    const gradientColors = stops.map(temp => colorScale(temp).hex()).join(', ');
    
    return (
      <div className="map-legend">
        <h4 className="legend-title">{title}</h4>
        <p className="legend-subtitle">{formattedDate}</p>
        <div className="legend-gradient-container">
          <div 
            className="legend-gradient" 
            style={{ background: `linear-gradient(to right, ${gradientColors})` }}
          ></div>
        </div>
        <div className="legend-labels">
          <span>{minValue}°C</span>
          <span>-10°C</span>
          <span>0°C</span>
          <span>20°C</span>
          <span>40°C</span>
          <span>{maxValue}°C</span>
        </div>
        {/* <div className="legend-data-range">
          <span>Data range: {minValue.toFixed(1)}°C to {maxValue.toFixed(1)}°C</span>
        </div> */}
      </div>
    );
  } 
  // For rainfall data
  else if (type === 'rainfall') {
    const stops = [0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20];
    const gradientColors = stops.map(temp => colorScale(temp).hex()).join(', ');
    return (
      <div className="map-legend">
        <h4 className="legend-title">{title}</h4>
        <p className="legend-subtitle">{formattedDate}</p>
        <div className="legend-gradient-container">
          <div 
            className="legend-gradient" 
            style={{ 
              background: `linear-gradient(to right, ${gradientColors})` 
            }}
          ></div>
        </div>
        <div className="legend-labels">
          <span>0</span>
          <span>2.5</span>
          <span>5</span>
          <span>7.5</span>
          <span>10</span>
          <span>12.5</span>
          <span>15</span>
          <span>17.5</span>
          <span>{maxValue}</span>
        </div>
      </div>
    );
  }
  
  // Default case - should not happen if type is properly specified
  return null;
};

/**
 * MapLegendContainer Component
 * Handles positioning the legend on the map
 */
const MapLegendContainer = ({ 
  minValue, 
  maxValue, 
  colorScale, 
  title, 
  type, 
  date,
  position = 'bottom-left'
}) => {
  if (!colorScale || minValue === undefined || maxValue === undefined) {
    return null; // Don't render if required props are missing
  }
  
  // Apply position classes
  const positionClass = `map-legend-container ${position}`;
  
  return (
    <div className={positionClass}>
      <MapLegend
        minValue={minValue}
        maxValue={maxValue}
        colorScale={colorScale}
        title={title}
        type={type}
        date={date}
      />
    </div>
  );
};

export default MapLegendContainer; 