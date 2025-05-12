// This is the component for the station select card when the user clicks on a station on the map

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Box, CircularProgress, Alert } from '@mui/material';
import { format } from 'date-fns';
import { fetchStationDailyWeather, fetchStationMonthlyWeather, fetchStationYearlyWeather } from '../../services/weatherApi';
import { useMapContext } from '../../context/MapContext';
import DataTube from '../selectedStations/dataTube';

/**
 * Station Select Card Component
 * Displays information about a selected station and provides options to interact with it
 * 
 * @param {Object} station - The selected station data (can be provided directly or from context)
 * @param {Function} onClose - Function to call when the card is closed (optional, defaults to context handler)
 * @param {Function} onSelect - Function to call when the station is selected (optional)
 */
const StationSelectCard = ({ 
  station: propStation, 
  onClose: propOnClose, 
  onSelect: propOnSelect = () => {} 
}) => {
  // Get context values
  const { 
    selectedDate, 
    selectedMapStation, 
    clearSelectedMapStation,
    addStation,
    timeFrequency
  } = useMapContext();
  
  // Use station from props or context
  const station = propStation || selectedMapStation;
  
  // Use onClose from props or default to context's clearSelectedMapStation
  const onClose = propOnClose || clearSelectedMapStation;
  
  if (!station) return null;
  
  const [rainfallData, setRainfallData] = useState({ rainfall: 'No data' });
  const [temperatureData, setTemperatureData] = useState({ minTemp: 'No data', maxTemp: 'No data' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch weather data when station or selected date changes
  useEffect(() => {
    const fetchData = async () => {
      if (!station || !station.station_id || !selectedDate) {
        console.log('Missing required data for fetching weather:', { 
          stationExists: !!station,
          stationId: station?.station_id, 
          selectedDate
        });
        setRainfallData({ rainfall: 'No data' });
        setTemperatureData({ minTemp: 'No data', maxTemp: 'No data' });
        setError('Missing required station or date information');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
          let weatherData;
          
          // Determine which weather API to call based on the timeFrequency
          const isYearly = Array.isArray(timeFrequency) && timeFrequency.length === 1 && timeFrequency[0] === 'year';
          const isMonthly = Array.isArray(timeFrequency) && timeFrequency.includes('month');
          
          let period = '';
          const year = selectedDate.getFullYear();
          
          // Check for older dates with potentially missing data
          if (year < 2005) {
            console.warn(`Selected year ${year} may have limited or no data for some stations`);
          }
          
          if (isYearly) {
              // Yearly frequency - display annual average
              period = `year ${year}`;
              console.log(`Fetching yearly weather data for ${station.station_id} in ${year}`);
              weatherData = await fetchStationYearlyWeather(station.station_id, year);
          } else if (isMonthly) {
              // Monthly frequency - display monthly average
              const month = selectedDate.getMonth() + 1; // JavaScript months are 0-indexed
              period = `${format(selectedDate, 'MMMM yyyy')}`;
              console.log(`Fetching monthly weather data for ${station.station_id} in ${month}/${year}`);
              weatherData = await fetchStationMonthlyWeather(station.station_id, month, year);
          } else {
              // Daily frequency (fallback)
              period = format(selectedDate, 'MMMM d, yyyy');
              console.log(`Fetching daily weather data for ${station.station_id} on ${selectedDate.toISOString().split('T')[0]}`);
              weatherData = await fetchStationDailyWeather(station.station_id, selectedDate);
          }
          
          // Handle case where weather API returns null or undefined
          if (!weatherData) {
              console.error('Weather data returned null or undefined');
              setRainfallData({ rainfall: 'No data' });
              setTemperatureData({
                  minTemp: 'No data',
                  maxTemp: 'No data'
              });
              setError(`No weather data available for ${period}`);
              return;
          }
          
          const [rainfall, [minTemp, maxTemp]] = weatherData;
          console.log('rainfall', rainfall);
          console.log(`min/max temperature: ${minTemp} / ${maxTemp}`);

          // If all values are null, show an error message
          if (rainfall === null && minTemp === null && maxTemp === null) {
              setRainfallData({ rainfall: 'No data' });
              setTemperatureData({
                  minTemp: 'No data',
                  maxTemp: 'No data'
              });
              
              setError(`No weather data available for ${period}`);
              return;
          }

          // Set rainfall data - API returns a float value
          // Handle the case where rainfall might be null or undefined
          setRainfallData({ rainfall: typeof rainfall === 'number' ? rainfall : 'No data' });
          
          // Set temperature data - API returns a float value
          // Handle the case where temperature might be null or undefined
          setTemperatureData({
            minTemp: typeof minTemp === 'number' ? minTemp : 'No data',
            maxTemp: typeof maxTemp === 'number' ? maxTemp : 'No data'
          });
          
          // Clear any error since we have valid data
          setError(null);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setRainfallData({ rainfall: 'No data' });
        setTemperatureData({ minTemp: 'No data', maxTemp: 'No data' });
        
        // Set a more helpful error message based on the type of error
        if (error.response && error.response.status === 500) {
          setError('Server error: Data may not be available for this time period');
        } else {
          setError('Failed to load weather data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [station?.station_id, selectedDate, timeFrequency]);

  const handleSelect = () => {
    // Add the station to the context's selected stations
    addStation({
      id: station.station_id,
      name: station.station_name,
      state: station.station_state,
      elevation: station.station_height,
      startYear: station.station_start_year,
      endYear: station.station_end_year,
      latitude: station.location?.coordinates[1],
      longitude: station.location?.coordinates[0]
    });
    
    // Call onSelect from props if provided
    propOnSelect(station);
    
    // Close the card
    onClose();
  };
  
  // Calculate fill percentages based on the specified ranges
  // Rainfall: 0mm = 0%, >= 30mm = 100%
  // Temperature: <=-10°C = 0%, >=40°C = 100%
  const calculateRainfallPercentage = (rainfall) => {
    // Handle non-numeric values
    if (rainfall === undefined || rainfall === null || rainfall === 'No data') return 0;
    
    // Convert to number if it's a string that can be parsed
    const numericRainfall = typeof rainfall === 'string' ? parseFloat(rainfall) : rainfall;
    
    // Check if it's a valid number after conversion
    if (isNaN(numericRainfall) || numericRainfall <= 0) return 0;
    if (numericRainfall >= 30) return 100;
    
    return (numericRainfall / 30) * 100;
  };
  
  const calculateTemperaturePercentage = (temperature) => {
    // Handle non-numeric values
    if (temperature === undefined || temperature === null || temperature === 'No data') return 0;
    
    // Convert to number if it's a string that can be parsed
    const numericTemp = typeof temperature === 'string' ? parseFloat(temperature) : temperature;
    
    // Check if it's a valid number after conversion
    if (isNaN(numericTemp) || numericTemp <= -10) return 0;
    if (numericTemp >= 40) return 100;
    
    // Scale from -10 to 50 (range of 60 degrees)
    return ((numericTemp + 10) / 60) * 100;
  };
  
  const rainfallPercentage = rainfallData ? calculateRainfallPercentage(rainfallData.rainfall || 0) : 0;
  const minTempPercentage = temperatureData ? calculateTemperaturePercentage(temperatureData.minTemp || 0) : 0;
  const maxTempPercentage = temperatureData ? calculateTemperaturePercentage(temperatureData.maxTemp || 0) : 0;

  // Determine if we're showing average data based on the timeFrequency
  const isYearly = Array.isArray(timeFrequency) && timeFrequency.length === 1 && timeFrequency[0] === 'year';
  const isMonthly = Array.isArray(timeFrequency) && timeFrequency.includes('month');
  
  // Create appropriate labels based on the timeFrequency
  const rainfallLabel = isYearly ? 'Avg Annual Rainfall' : isMonthly ? 'Avg Monthly Rainfall' : 'Rainfall';
  const tempLabel = isYearly ? 'Avg Annual Temp' : isMonthly ? 'Avg Monthly Temp' : 'Temperature';

  return (
    <div style={{ position: 'relative' }}>
      <Card 
        sx={{ 
          width: '100%', 
          maxWidth: 300,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          borderRadius: '20px',
          position: 'relative',
          bgcolor: 'white',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid white'
          }
        }}
      >
        <CardContent sx={{ p: 2, pb: 2 }}>
          <Typography variant="subtitle1" component="div" sx={{ 
            fontWeight: 'bold', 
            mb: 1.5,
            height: '40px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.2',
            fontSize: '0.95rem'
          }}>
            {station?.station_name || 'Unnamed Station'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 'bold' }}>ID:</span> {station?.station_id || 'Unknown'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 'bold' }}>State:</span> {station?.station_state || 'Unknown'}
          </Typography>
          
          {station?.station_height && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 'bold' }}>Elevation:</span> {station.station_height}m
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 2 }}>
            <span style={{ fontWeight: 'bold' }}>Years:</span> {station?.station_start_year || 'N/A'} — {station?.station_end_year || 'Present'}
          </Typography>
          
          {error && (
            <Alert severity="warning" sx={{ mb: 2, fontSize: '0.75rem', py: 0.5 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-end',
            mt: 1,
            mb: 1.5
          }}>
            <Box sx={{ 
              width: '100%', 
              display: 'flex', 
              flexDirection: 'row', 
              justifyContent: 'space-around',
              alignItems: 'flex-end'
            }}>
              <DataTube 
                label={rainfallLabel}
                value={rainfallData?.rainfall}
                unit="mm"
                fillPercentage={rainfallPercentage}
                fillColor="rgb(0, 106, 255)"
                loading={loading}
                width={70}
              />
              
              <DataTube 
                label={tempLabel}
                value={{
                  min: temperatureData?.minTemp,
                  max: temperatureData?.maxTemp
                }}
                unit="°C"
                isTemperatureTube={true}
                minPercentage={minTempPercentage}
                maxPercentage={maxTempPercentage}
                loading={loading}
                width={100}
              />
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, fontSize: '0.75rem' }}>
            {selectedDate ? 
              (isYearly ? 
                format(selectedDate, 'yyyy') : 
                isMonthly ? 
                  format(selectedDate, 'MMMM yyyy') : 
                  format(selectedDate, 'MMMM d, yyyy')
              ) : 'No date selected'}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button 
              size="small" 
              color="primary" 
              variant="contained"
              onClick={handleSelect}
              sx={{ 
                fontSize: '0.8rem', 
                py: 0.5,
                borderRadius: '8px'
              }}
            >
              Select Station
            </Button>
            
            <Button 
              size="small" 
              color="secondary"
              onClick={onClose}
              sx={{ 
                fontSize: '0.8rem', 
                py: 0.5,
                borderRadius: '8px'
              }}
            >
              Close
            </Button>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

export default StationSelectCard;



