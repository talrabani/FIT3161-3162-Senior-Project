import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import './LoadingMap.css';

/**
 * LoadingMap Component
 * Displays a loading screen while the map is initializing
 * 
 * @param {boolean} show - Whether to show the loading screen
 * @param {string} message - Optional custom loading message
 * @param {string} subtitle - Optional subtitle message
 */
const LoadingMap = ({ 
  show, 
  message = 'Loading map data...', 
  subtitle = 'Please wait while we get the latest weather information'
}) => {
  return (
    <div className={`loading-map-overlay ${!show ? 'hidden' : ''}`}>
      <div className="loading-map-spinner">
        <CircularProgress size={60} thickness={4} color="primary" />
      </div>
      
      <div className="loading-map-message">
        {message}
      </div>
      
      <div className="loading-map-subtitle">
        {subtitle}
      </div>
    </div>
  );
};

export default LoadingMap;
