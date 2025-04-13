import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Box, Grid, CircularProgress } from '@mui/material';
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
    const formattedDate = selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Date not selected';
    
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
            
            // Handle possible array or direct object response for rainfall data
            setRainfallData(Array.isArray(rainfall) ? rainfall[0] || { rainfall: 0 } : rainfall || { rainfall: 0 });
            
            // Handle possible array or direct object response for temperature data
            setTemperatureData(Array.isArray(temperature) ? temperature[0] || { temperature: 0 } : temperature || { temperature: 0 });
          
        } catch (error) {
          console.error('Error fetching weather data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }, [station.id, selectedDate]);
    
    // Handle remove button click
    const handleRemove = () => {
      // The removeLocation function in useWeatherData expects a location name
      console.log('Removing station:', station.name);
      onRemove(station.name);
    };
    
    return (
      <Card 
        sx={{ 
          position: 'relative', 
          borderRadius: 4,
          mb: 2,
          overflow: 'visible',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Button 
          size="small"
          onClick={handleRemove}
          sx={{ 
            position: 'absolute', 
            right: 0, 
            top: 0,
            minWidth: '30px',
            height: '30px',
            m: 1,
            p: 0,
            backgroundColor: 'error.main',
            color: 'white',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: 'error.dark',
            }
          }}
        >
          X
        </Button>
        
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" component="div" gutterBottom>
            {station.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            ID: {station.id || '000000'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            State: {station.state || 'xxx'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Elevation: {station.elevation || '000.0'}m
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Years: {station.startYear || '1900'} — {station.endYear || '2025'}
          </Typography>
          
          {error && (
            <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem' }}>
              {error}
            </Typography>
          )}
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" align="center">
                Rainfall
              </Typography>
              <Box sx={{ mt: 1, mb: 1, position: 'relative', height: '100px', border: '1px solid #ccc', borderRadius: 1 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    width: '100%', 
                    height: `${rainfallValue}%`, 
                    bgcolor: '#29B6F6', // Light blue for rainfall
                    borderBottomLeftRadius: 3,
                    borderBottomRightRadius: 3,
                    transition: 'height 0.5s ease-in-out'
                  }} />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                {loading ? '-' : `${rainfallData?.rainfall.toFixed(1) || 0}mm`}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" align="center">
                Temperature
              </Typography>
              <Box sx={{ mt: 1, mb: 1, position: 'relative', height: '100px', border: '1px solid #ccc', borderRadius: 1 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    width: '100%', 
                    height: `${temperatureValue}%`, 
                    bgcolor: '#FFE082', // Light yellow for temperature
                    borderBottomLeftRadius: 3,
                    borderBottomRightRadius: 3,
                    transition: 'height 0.5s ease-in-out'
                  }} />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                {loading ? '-' : `${temperatureData?.temperature.toFixed(1) || 0}°C`}
              </Typography>
            </Grid>
          </Grid>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            {formattedDate}
          </Typography>
        </CardContent>
      </Card>
    );
  };

export default StationCard;