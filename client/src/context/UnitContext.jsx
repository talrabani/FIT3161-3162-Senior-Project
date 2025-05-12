import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/auth.service';

// Create the context
const UnitContext = createContext({
  units: 'metric', // Default value is metric
  setUnits: () => {},
  convertTemperature: () => {},
  convertRainfall: () => {},
  formatTemperature: () => {},
  formatRainfall: () => {}
});

// Custom hook to use the unit context
export const useUnits = () => useContext(UnitContext);

// Provider component to wrap the app with
export const UnitProvider = ({ children }) => {
  const [units, setUnits] = useState('metric');
  
  // Load the user's unit preferences when the component mounts
  useEffect(() => {
    const loadUserUnits = async () => {
      try {
        // First try to get from the API
        const userData = await AuthService.getUserInfo();
        if (userData && userData.units) {
          setUnits(userData.units);
        } else {
          // Fallback to local storage if API fails
          const user = AuthService.getCurrentUser();
          if (user && user.user && user.user.units) {
            setUnits(user.user.units);
          }
        }
      } catch (error) {
        console.error('Error loading user units:', error);
      }
    };
    
    loadUserUnits();
  }, []);
  
  // Conversion functions for temperature (Celsius to Fahrenheit and vice versa)
  const convertTemperature = (tempValue, targetUnit = units) => {
    if (tempValue === null || tempValue === undefined || isNaN(tempValue)) {
      return tempValue;
    }
    
    // Convert to number if it's a string
    const temp = typeof tempValue === 'string' ? parseFloat(tempValue) : tempValue;
    
    if (targetUnit === 'imperial') {
      // Celsius to Fahrenheit: F = (C * 9/5) + 32
      return (temp * 9/5) + 32;
    } else {
      // Fahrenheit to Celsius: C = (F - 32) * 5/9
      return (temp - 32) * 5/9;
    }
  };
  
  // Conversion functions for rainfall (mm to inches and vice versa)
  const convertRainfall = (rainfallValue, targetUnit = units) => {
    if (rainfallValue === null || rainfallValue === undefined || isNaN(rainfallValue)) {
      return rainfallValue;
    }
    
    // Convert to number if it's a string
    const rainfall = typeof rainfallValue === 'string' ? parseFloat(rainfallValue) : rainfallValue;
    
    if (targetUnit === 'imperial') {
      // mm to inches: 1 mm = 0.0393701 inches
      return rainfall * 0.0393701;
    } else {
      // inches to mm: 1 inch = 25.4 mm
      return rainfall * 25.4;
    }
  };
  
  // Format temperature value with units
  const formatTemperature = (tempValue, precision = 1) => {
    if (tempValue === null || tempValue === undefined || isNaN(tempValue)) {
      return 'N/A';
    }
    
    // Convert to number if it's a string and apply unit conversion
    const temp = typeof tempValue === 'string' ? parseFloat(tempValue) : tempValue;
    const convertedTemp = units === 'imperial' ? convertTemperature(temp) : temp;
    
    // Format with specified precision and add unit
    return `${convertedTemp.toFixed(precision)}${units === 'imperial' ? '°F' : '°C'}`;
  };
  
  // Format rainfall value with units
  const formatRainfall = (rainfallValue, precision = 1) => {
    if (rainfallValue === null || rainfallValue === undefined || isNaN(rainfallValue)) {
      return 'N/A';
    }
    
    // Convert to number if it's a string and apply unit conversion
    const rainfall = typeof rainfallValue === 'string' ? parseFloat(rainfallValue) : rainfallValue;
    const convertedRainfall = units === 'imperial' ? convertRainfall(rainfall) : rainfall;
    
    // Format with specified precision and add unit
    return `${convertedRainfall.toFixed(precision)}${units === 'imperial' ? ' in' : ' mm'}`;
  };
  
  // Update user's unit preference in database and local storage
  const updateUnits = async (newUnits) => {
    setUnits(newUnits);
    
    try {
      // Update in database
      await AuthService.updateUserPreferences({ units: newUnits });
    } catch (error) {
      console.error('Error updating units preference:', error);
    }
  };
  
  const value = {
    units,
    setUnits: updateUnits,
    convertTemperature,
    convertRainfall,
    formatTemperature,
    formatRainfall
  };
  
  return (
    <UnitContext.Provider value={value}>
      {children}
    </UnitContext.Provider>
  );
};

export default UnitContext; 