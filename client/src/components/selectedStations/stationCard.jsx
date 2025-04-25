import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Box, CircularProgress } from '@mui/material';
import { format } from 'date-fns';
import { fetchStationRainfall, fetchStationTemperature } from '../../services/weatherApi';

/**
 * StationCard Component
 * Displays a card with station information and weather data
 * 
 * @param {Object} station - The station data
 * @param {Function} onRemove - Function to call when removing the station
 * @param {Date} selectedDate - The currently selected date
 */
const StationCard = ({ station, onRemove, selectedDate }) => {
    const [rainfallData, setRainfallData] = useState(null);
    const [temperatureData, setTemperatureData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    
    // Fetch weather data when station or date changes
    useEffect(() => {
      const fetchData = async () => {
        if (!station.id || !selectedDate) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Call weather api to get rainfall and temperature data
            const [rainfall, [minTemp, maxTemp]] = await Promise.all([
              fetchStationRainfall(station.id, selectedDate),
              fetchStationTemperature(station.id, selectedDate)
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
    }, [station.id, selectedDate]);
    
    // Handle remove button click
    const handleRemove = () => {
      console.log('Removing station:', station.name);
      onRemove(station.name);
    };
    // Calculate fill percentages based on the specified ranges
    // Rainfall: 0mm = 0%, >=200mm = 100%
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
      <Card 
        sx={{ 
          position: 'relative',
          width: '230px',
          borderRadius: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          m: 1,
          bgcolor: 'white'
        }}
      >
        <Button 
          size="small"
          onClick={handleRemove}
          sx={{ 
            position: 'absolute', 
            right: 10, 
            top: 10,
            minWidth: '24px',
            width: '24px',
            height: '24px',
            p: 0,
            borderRadius: '4px',
            backgroundColor: 'error.main',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
            '&:hover': {
              backgroundColor: 'error.dark',
            }
          }}
        >
          X
        </Button>
        
        <CardContent sx={{ p: 2, pb: 2 }}>
          <Typography variant="subtitle1" component="div" sx={{ 
            fontWeight: 'bold', 
            mb: 1.5,
            pr: 2, // Space for X button
            height: '40px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.2',
            fontSize: '0.95rem'
          }}>
            {station.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 'bold' }}>ID:</span> {station.id || '000000'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 'bold' }}>State:</span> {station.state || 'xxx'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 'bold' }}>Elevation:</span> {station.elevation || '000.0'}m
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 2 }}>
            <span style={{ fontWeight: 'bold' }}>Years:</span> {station.startYear || '1900'} — {station.endYear || '2025'}
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
                    {/* <Box sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    width: '100%', 
                    height: `${temperaturePercentage}%`, 
                    bgcolor: '#FFE082', // Light yellow for temperature
                    transition: 'height 0.5s ease-in-out'
                    // }} /> */}
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
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date'}
          </Typography>
        </CardContent>
      </Card>
    );
  };

export default StationCard;