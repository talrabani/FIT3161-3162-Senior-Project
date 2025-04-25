// This is the component for the station select card when the user clicks on a station on the map

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Box, CircularProgress } from '@mui/material';
import { format } from 'date-fns';
import { fetchStationRainfall, fetchStationTemperature } from '../../services/weatherApi';
import { useMapContext } from '../../context/MapContext';

/**
 * Station Select Card Component
 * Displays information about a selected station and provides options to interact with it
 * 
 * @param {Object} station - The selected station data
 * @param {Function} onClose - Function to call when the card is closed
 * @param {Function} onSelect - Function to call when the station is selected
 */
const StationSelectCard = ({ station, onClose, onSelect }) => {
  if (!station) return null;
  
  // Get the selectedDate from the context
  const { selectedDate } = useMapContext();
  
  const [rainfallData, setRainfallData] = useState(null);
  const [temperatureData, setTemperatureData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch weather data when station or selected date changes
  useEffect(() => {
    const fetchData = async () => {
      if (!station.station_id || !selectedDate) return;
      
      setLoading(true);
      setError(null);
      
      try {
          // Call weather api to get rainfall and temperature data
          const [rainfall, [minTemp, maxTemp]] = await Promise.all([
            fetchStationRainfall(station.station_id, selectedDate),
            fetchStationTemperature(station.station_id, selectedDate)
          ]);
          
          console.log('rainfall', rainfall);
          console.log(`min/max temperature: ${minTemp} / ${maxTemp}`);

          // Set rainfall data - API returns a float value
          // Handle the case where rainfall might be null or undefined
          setRainfallData({ rainfall: typeof rainfall === 'number' ? rainfall : 0 });
          
          // Set temperature data - API returns a float value
          // Handle the case where temperature might be null or undefined
          setTemperatureData({
            minTemp: typeof minTemp === 'number' ? minTemp : 0,
            maxTemp: typeof maxTemp === 'number' ? maxTemp : 0
          });
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setRainfallData({ rainfall: 0 });
        setTemperatureData({ minTemp: 0, maxTemp: 0 });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [station.station_id, selectedDate]);

  const handleSelect = () => {
    if (onSelect) {
      onSelect(station);
    }
  };
  // Calculate fill percentages based on the specified ranges
  // Rainfall: 0mm = 0%, >= 200mm = 100%
  // Temperature: <=-10°C = 0%, >=40°C = 100%
  const calculateRainfallPercentage = (rainfall) => {
    if (rainfall <= 0) return 0;
    if (rainfall >= 200) return 100;
    return (rainfall / 200) * 100;
  };
  
  const calculateTemperaturePercentage = (temperature) => {
    if (temperature <= -10) return 0;
    if (temperature >= 40) return 100;
    // Scale from -10 to 40 (range of 50 degrees)
    return ((temperature + 10) / 50) * 100;
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
            {station.station_name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 'bold' }}>ID:</span> {station.station_id}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 'bold' }}>State:</span> {station.station_state}
          </Typography>
          
          {station.station_height && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 'bold' }}>Elevation:</span> {station.station_height}m
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 2 }}>
            <span style={{ fontWeight: 'bold' }}>Years:</span> {station.station_start_year || 'N/A'} — {station.station_end_year || 'Present'}
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
                  {loading ? '-' : rainfallData?.rainfall >= 0 ? `${rainfallData.rainfall.toFixed(1)}mm` : 'No data'}
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
                      height: `${minTempPercentage > 0? '0px': '4px'}`, 
                      bgcolor: 'rgb(125, 194, 255)' // Different light blue shade for min temp
                    }} />
                    <Box sx={{ // Max temperature line
                      position: 'absolute', 
                      bottom: `${maxTempPercentage}%`, 
                      width: '100%', 
                      height: `${maxTempPercentage > 0? '0px': '4px'}`, 
                      bgcolor: 'rgb(255, 196, 4)', // Light yellow for max temp
                    }} />
                    </>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                {loading ? '-' : temperatureData?.maxTemp >= -80 ? `${temperatureData.minTemp.toFixed(1)}°C to ${temperatureData.maxTemp.toFixed(1)}°C` : 'No data'}
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



