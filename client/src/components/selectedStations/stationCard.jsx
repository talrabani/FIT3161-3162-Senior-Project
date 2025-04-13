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
    
    // For visual representation, use percentages (a real implementation would scale actual values)
    const rainfallValue = rainfallData ? Math.min(rainfallData.rainfall || 0, 100) : 0; 
    const temperatureValue = temperatureData ? Math.min((temperatureData.temperature || 0) * 2, 100) : 0;
    
    // Fetch weather data when station or date changes
    useEffect(() => {
      const fetchData = async () => {
        if (!station.id || !selectedDate) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Call weather api to get rainfall and temperature data
            const [rainfall, temperature] = await Promise.all([
              fetchStationRainfall(station.id, selectedDate),
              fetchStationTemperature(station.id, selectedDate)
            ]);
            
            console.log('rainfall', rainfall);
            console.log('temperature', temperature);

            // Set rainfall data - API returns a float value
            // Handle the case where rainfall might be null or undefined
            setRainfallData({ rainfall: typeof rainfall === 'number' ? rainfall : 0 });
            
            // Set temperature data - API returns a float value
            // Handle the case where temperature might be null or undefined
            setTemperatureData({ temperature: typeof temperature === 'number' ? temperature : 0 });
        } catch (error) {
          console.error('Error fetching weather data:', error);
          setRainfallData({ rainfall: 0 });
          setTemperatureData({ temperature: 0 });
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
            ID: {station.id || '000000'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            State: {station.state || 'xxx'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            Elevation: {station.elevation || '000.0'}m
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 2 }}>
            Years: {station.startYear || '1900'} — {station.endYear || '2025'}
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
                      height: `${rainfallValue}%`, 
                      bgcolor: '#29B6F6', // Light blue for rainfall
                      transition: 'height 0.5s ease-in-out'
                    }} />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                  {loading ? '-' : rainfallData?.rainfall >= 0 ? `${rainfallData.rainfall.toFixed(1)}mm` : 'NaN'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '70px' }}>
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
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      width: '100%', 
                      height: `${temperatureValue}%`, 
                      bgcolor: '#FFE082', // Light yellow for temperature
                      transition: 'height 0.5s ease-in-out'
                    }} />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                  {loading ? '-' : temperatureData?.temperature >= -80 ? `${temperatureData.temperature.toFixed(1)}°C` : 'NaN'}
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