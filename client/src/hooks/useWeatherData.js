import { useState, useCallback, useEffect } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { fetchHistoricalWeather, fetchCurrentObservations, fetchWeatherForecast } from '../services/weatherApi';

/**
 * Custom hook for fetching and managing weather data
 * @returns {Object} Weather data and utility functions
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
  
  // Use useQueries for observations (instead of mapping useQuery)
  const observationResults = useQueries({
    queries: selectedLocations.map(location => ({
      queryKey: ['observations', location.name, location.stationId],
      queryFn: () => fetchCurrentObservations(location.stationId, location.state),
      enabled: !!location.stationId,
      retry: 0,
      staleTime: 1000 * 60 * 15, // 15 minutes
      onError: () => {
        console.error('Observation query failed for', location.name);
        setHasError(true);
      }
    })),
    combine: (results) => {
      return {
        data: results.map(result => result.data),
        isLoading: results.some(result => result.isLoading),
        isError: results.some(result => result.isError)
      };
    }
  });
  
  // Use useQueries for forecasts (instead of mapping useQuery)
  const forecastResults = useQueries({
    queries: selectedLocations.map(location => ({
      queryKey: ['forecast', location.name],
      queryFn: () => fetchWeatherForecast(location.latitude, location.longitude),
      enabled: !!location.name,
      staleTime: 1000 * 60 * 60, // 1 hour
      onError: () => {
        console.error('Forecast query failed for', location.name);
        setHasError(true);
      }
    })),
    combine: (results) => {
      return {
        data: results.map(result => result.data),
        isLoading: results.some(result => result.isLoading),
        isError: results.some(result => result.isError)
      };
    }
  });
  
  // Use useQueries for historical data (instead of mapping useQuery)
  const historicalResults = useQueries({
    queries: selectedLocations.map(location => ({
      queryKey: ['weather', location.name, dateRange.startDate, dateRange.endDate],
      queryFn: () => fetchHistoricalWeather(
        location.latitude, 
        location.longitude, 
        dateRange.startDate, 
        dateRange.endDate
      ),
      enabled: !!location.name,
      staleTime: 1000 * 60 * 60 * 24, // 24 hours for historical data
      onError: () => {
        console.error('Historical query failed for', location.name);
        setHasError(true);
      }
    })),
    combine: (results) => {
      return {
        data: results.map(result => result.data),
        isLoading: results.some(result => result.isLoading),
        isError: results.some(result => result.isError)
      };
    }
  });
  
  // Overall loading and error states
  const isLoading = 
    observationResults.isLoading || 
    forecastResults.isLoading || 
    historicalResults.isLoading;
  
  const isError = 
    hasError || 
    observationResults.isError || 
    forecastResults.isError || 
    historicalResults.isError;
  
  // Combine weather data with location information
  const weatherData = selectedLocations.map((location, index) => {
    return {
      location,
      historicalData: historicalResults.data[index] || { daily: { time: [] } },
      observationData: observationResults.data[index] || { data: [] },
      forecastData: forecastResults.data[index] || { daily: { time: [] } },
      isLoading: (
        (index < observationResults.data.length && observationResults.isLoading) ||
        (index < forecastResults.data.length && forecastResults.isLoading) ||
        (index < historicalResults.data.length && historicalResults.isLoading)
      ),
      isError: (
        (index < observationResults.data.length && observationResults.isError) ||
        (index < forecastResults.data.length && forecastResults.isError) ||
        (index < historicalResults.data.length && historicalResults.isError)
      ),
    };
  });
  
  return {
    selectedLocations,
    addLocation,
    removeLocation,
    dateRange,
    updateDateRange,
    chartType,
    toggleChartType,
    weatherData,
    isLoading,
    isError,
  };
}; 