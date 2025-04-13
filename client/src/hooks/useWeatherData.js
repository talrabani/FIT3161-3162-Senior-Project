import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Custom hook for managing location and station selections
 * @returns {Object} Location data and utility functions
 */
export const useWeatherData = () => {
  // Selected locations for comparison
  const [selectedLocations, setSelectedLocations] = useState([]);
  


  // Error state for overall application
  const [hasError, setHasError] = useState(false);
  
  // Add location to comparison
  const addLocation = useCallback((location) => {
    try {
      setSelectedLocations(prev => {
        
        // Add validation
        if (!location || !location.name || !location.latitude || !location.longitude) {
          console.error('Invalid location data', location);
          return prev;
        }
        
        console.log('Adding location:', location.name);
        
        // Create a deep copy of the location to avoid reference issues
        const locationCopy = JSON.parse(JSON.stringify(location));
        return [...prev, locationCopy];
      });
    } catch (error) {
      console.error('Error adding location:', error);
      // Don't modify state if there's an error
    }
  }, []);
  
  // Remove location from comparison
  const removeLocation = useCallback((locationName) => {
    setSelectedLocations(prev => prev.filter(loc => loc.name !== locationName));
  }, []);

  // Reset error state whenever selections change
  useEffect(() => {
    setHasError(false);
  }, [selectedLocations]);
  

  return {
    selectedLocations,
    addLocation,
    removeLocation,
    isLoading: false,
    isError: hasError,
  };
}; 