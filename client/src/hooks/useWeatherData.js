import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Custom hook for managing location and station selections
 * @returns {Object} Location data and utility functions
 */
export const useWeatherData = () => {
  // Selected locations for comparison
  const [selectedLocations, setSelectedLocations] = useState([]);
  
  // Date range for historical data
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0], // Last year Jan 1
    endDate: new Date().toISOString().split('T')[0], // Today
  });

  // Chart type - 'temperature' or 'rainfall'
  const [chartType, setChartType] = useState('temperature');
  
  // Error state for overall application
  const [hasError, setHasError] = useState(false);
  
  // Add location to comparison
  const addLocation = useCallback((location) => {
    try {
      setSelectedLocations(prev => {
        // Don't add if already selected (max 3 locations)
        if (prev.some(loc => loc.name === location.name) || prev.length >= 3) {
          return prev;
        }
        
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
  
  // Update date range
  const updateDateRange = useCallback((start, end) => {
    setDateRange({
      startDate: start,
      endDate: end,
    });
  }, []);

  // Toggle chart type
  const toggleChartType = useCallback(() => {
    setChartType(prev => prev === 'temperature' ? 'rainfall' : 'temperature');
  }, []);
  
  // Reset error state whenever selections change
  useEffect(() => {
    setHasError(false);
  }, [selectedLocations, dateRange.startDate, dateRange.endDate]);
  
  // Query client for invalidating queries
  const queryClient = useQueryClient();
  
  return {
    selectedLocations,
    addLocation,
    removeLocation,
    dateRange,
    updateDateRange,
    chartType,
    toggleChartType,
    isLoading: false,
    isError: hasError,
  };
}; 