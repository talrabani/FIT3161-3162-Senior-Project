// This is the component for the station select card when the user clicks on a station on the map

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Box, CircularProgress } from '@mui/material';
import { format } from 'date-fns';
import { fetchStationWeather } from '../../services/weatherApi';
import { useMapContext } from '../../context/MapContext';

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
    addStation
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
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
          // Call weather api to get rainfall and temperature data
          const weatherData = await fetchStationWeather(station.station_id, selectedDate);
          
          // Handle case where fetchStationWeather returns null or undefined
          if (!weatherData) {
              console.error('Weather data returned null or undefined');
              setRainfallData({ rainfall: 'No data' });
              setTemperatureData({
                  minTemp: 'No data',
                  maxTemp: 'No data'
              });
              return;
          }
          
          const [rainfall, [minTemp, maxTemp]] = weatherData;
          console.log('rainfall', rainfall);
          console.log(`min/max temperature: ${minTemp} / ${maxTemp}`);

          // Set rainfall data - API returns a float value
          // Handle the case where rainfall might be null or undefined
          setRainfallData({ rainfall: typeof rainfall === 'number' ? rainfall : 'No data' });
          
          // Set temperature data - API returns a float value
          // Handle the case where temperature might be null or undefined
          setTemperatureData({
            minTemp: typeof minTemp === 'number' ? minTemp : 'No data',
            maxTemp: typeof maxTemp === 'number' ? maxTemp : 'No data'
          });
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setRainfallData({ rainfall: 'No data' });
        setTemperatureData({ minTemp: 'No data', maxTemp: 'No data' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [station?.station_id, selectedDate]);

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
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '70px' }}>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                  Rainfall
                </Typography>
                <Box sx={{ 
                  position: 'relative', 
                  width: '35px', 
                  height: '90px', 
                  border: '1px solid #ddd', 
                  borderRadius: 1,
                  bgcolor: '#fff'
                }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress size={16} />
                    </Box>
                  ) : (
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      width: '100%', 
                      height: `${rainfallPercentage}%`, 
                      bgcolor: 'rgb(0, 106, 255)', // Light blue for rainfall
                      transition: 'height 0.5s ease-in-out'
                    }} />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                  {loading 
                    ? '-' 
                    : (!rainfallData || rainfallData.rainfall === 'No data' || rainfallData.rainfall === null || rainfallData.rainfall === undefined) 
                        ? 'No data' 
                        : `${parseFloat(rainfallData.rainfall).toFixed(1)}mm`
                  }
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100px' }}>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                  Temperature
                </Typography>
                <Box sx={{ 
                  position: 'relative', 
                  width: '35px', 
                  height: '90px', 
                  border: '1px solid #ddd', 
                  borderRadius: 1,
                  bgcolor: '#fff'
                }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress size={16} />
                    </Box>
                  ) : (
                    <>
                    <Box sx={{ // Min temperature line
                      position: 'absolute', 
                      bottom: `${minTempPercentage}%`, 
                      width: '100%', 
                      height: `${minTempPercentage > 0? '4px': '0px'}`, 
                      bgcolor: 'rgb(125, 194, 255)' // Different light blue shade for min temp
                    }} />
                    <Box sx={{ // Max temperature line
                      position: 'absolute', 
                      bottom: `${maxTempPercentage}%`,
                      width: '100%', 
                      height: `${maxTempPercentage > 0? '4px': '0px'}`, 
                      bgcolor: 'rgb(255, 196, 4)', // Light yellow for max temp
                    }} />
                    </>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                  {loading 
                    ? '-' 
                    : (!temperatureData || temperatureData.minTemp === 'No data' || temperatureData.minTemp === null || temperatureData.minTemp === undefined ||
                        temperatureData.maxTemp === 'No data' || temperatureData.maxTemp === null || temperatureData.maxTemp === undefined) 
                        ? 'No data' 
                        : `${parseFloat(temperatureData.minTemp).toFixed(1)}°C to ${parseFloat(temperatureData.maxTemp).toFixed(1)}°C`
                  }
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, fontSize: '0.75rem' }}>
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date selected'}
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



