import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing location and station selections
 * This hook is maintained for backward compatibility but most station state
 * functionality has moved to MapContext.
 * 
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
        
        // Ensure we don't add duplicates
        if (prev.some(loc => loc.id === location.id)) {
          console.log('Station already selected, skipping:', location.name);
          return prev;
        }
        
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

  // Clear all selected locations
  const clearLocations = useCallback(() => {
    setSelectedLocations([]);
  }, []);

  // Reset error state whenever selections change
  useEffect(() => {
    setHasError(false);
  }, [selectedLocations]);
  
  return {
    selectedLocations,
    addLocation,
    removeLocation,
    clearLocations,
    isLoading: false,
    isError: hasError,
  };
}; 