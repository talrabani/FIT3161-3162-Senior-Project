import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Box, CircularProgress, Alert, Divider, Tooltip, Grid } from '@mui/material';
import { format } from 'date-fns';
import { fetchStationDailyWeather, fetchStationMonthlyWeather, fetchStationYearlyWeather } from '../../services/weatherApi';
import { useMapContext } from '../../context/MapContext';
import DataTube from './dataTube';

/**
 * StationCard Component
 * Displays a card with station information and weather data
 * 
 * @param {Object} station - The station data
 * @param {Function} onRemove - Function to call when removing the station
 * @param {Date} selectedDate - The currently selected date
 * @param {boolean} forceExpanded - Whether to force the expanded state from parent
 */
const StationCard = ({ 
  station = {}, 
  onRemove = () => {}, 
  selectedDate = null,
  forceExpanded = false
}) => {
    const [rainfallData, setRainfallData] = useState({ rainfall: 'No data' });
    const [temperatureData, setTemperatureData] = useState({ minTemp: 'No data', maxTemp: 'No data' });
    const [weatherDetails, setWeatherDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedStats, setExpandedStats] = useState(false);
    
    // Update expanded state when forceExpanded changes
    useEffect(() => {
      setExpandedStats(forceExpanded);
    }, [forceExpanded]);
    
    // Get time frequency from context
    const { timeFrequency } = useMapContext();
    
    // Fetch weather data when station or date changes
    useEffect(() => {
      const fetchData = async () => {
        if (!station || !station.id || !selectedDate) {
          console.log('Missing required data for fetching weather:', { 
            stationExists: !!station,
            stationId: station?.id, 
            selectedDate
          });
          setRainfallData({ rainfall: 'No data' });
          setTemperatureData({ minTemp: 'No data', maxTemp: 'No data' });
          setWeatherDetails(null);
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
            
            if (isYearly) {
                // Yearly frequency - display annual average
                period = `year ${year}`;
                console.log(`Fetching yearly weather data for ${station.id} in ${year}`);
                weatherData = await fetchStationYearlyWeather(station.id, year);
            } else if (isMonthly) {
                // Monthly frequency - display monthly average
                const month = selectedDate.getMonth() + 1; // JavaScript months are 0-indexed
                period = `${format(selectedDate, 'MMMM yyyy')}`;
                console.log(`Fetching monthly weather data for ${station.id} in ${month}/${year}`);
                weatherData = await fetchStationMonthlyWeather(station.id, month, year);
            } else {
                // Daily frequency (fallback)
                period = format(selectedDate, 'MMMM d, yyyy');
                console.log(`Fetching daily weather data for ${station.id} on ${selectedDate.toISOString().split('T')[0]}`);
                weatherData = await fetchStationDailyWeather(station.id, selectedDate);
            }
            
            // Handle case where weather API returns null or undefined
            if (!weatherData) {
                console.error('Weather data returned null or undefined');
                setRainfallData({ rainfall: 'No data' });
                setTemperatureData({
                    minTemp: 'No data',
                    maxTemp: 'No data'
                });
                setWeatherDetails(null);
                setError(`No weather data available for ${period}`);
                return;
            }
            
            // For monthly and yearly data, we now get a third element with additional details
            const [rainfall, [minTemp, maxTemp], details] = weatherData;
            console.log('rainfall', rainfall);
            console.log(`min/max temperature: ${minTemp} / ${maxTemp}`);
            console.log('additional details:', details);

            // Set the weather details for extended information
            setWeatherDetails(details);

            // If all values are null, show an error message
            if (rainfall === null && minTemp === null && maxTemp === null) {
                setRainfallData({ rainfall: 'No data' });
                setTemperatureData({
                    minTemp: 'No data',
                    maxTemp: 'No data'
                });
                setWeatherDetails(null);
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
          setWeatherDetails(null);
          
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
    }, [station?.id, selectedDate, timeFrequency]);
    
    // Handle remove button click
    const handleRemove = () => {
      console.log('Removing station:', station.name);
      onRemove(station.name);
    };
    // Calculate fill percentages based on the specified ranges
    // Rainfall: 0mm = 0%, >=30mm = 100%
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
      // Scale from -10 to 40 (range of 50 degrees)
      return ((numericTemp + 10) / 50) * 100;
    };
    
    const rainfallPercentage = rainfallData ? calculateRainfallPercentage(rainfallData.rainfall) : 0;
    const minTempPercentage = temperatureData ? calculateTemperaturePercentage(temperatureData.minTemp) : 0;
    const maxTempPercentage = temperatureData ? calculateTemperaturePercentage(temperatureData.maxTemp) : 0;

    // Determine if we're showing average data based on the timeFrequency
    const isYearly = Array.isArray(timeFrequency) && timeFrequency.length === 1 && timeFrequency[0] === 'year';
    const isMonthly = Array.isArray(timeFrequency) && timeFrequency.includes('month');
    
    // Create appropriate labels based on the timeFrequency
    const rainfallLabel = isYearly ? 'Average Annual Rainfall' : isMonthly ? 'Average Monthly Rainfall' : 'Rainfall';
    const tempLabel = isYearly ? 'Average Annual Temperature Range' : isMonthly ? 'Average Monthly Temperature Range' : 'Temperature';

    // Whether to show detailed info (only for monthly and yearly views with details available)
    const showDetailedInfo = (isMonthly || isYearly) && weatherDetails !== null;

    // Format date for display
    const formatDateString = (dateObj) => {
      if (!dateObj) return 'N/A';
      return format(dateObj, 'MMM d, yyyy');
    };

    // Format a number with specified precision
    const formatNumber = (num, precision = 1) => {
      if (num === null || num === undefined || isNaN(num)) return 'N/A';
      return parseFloat(num).toFixed(precision);
    };

    return (
      <Card 
        sx={{ 
          position: 'relative',
          width: showDetailedInfo ? '320px' : '230px',
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
            mb: 1,
            pr: 2, // Space for X button
            height: '40px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.2',
            fontSize: '0.95rem'
          }}>
            {station?.name || 'Unnamed Station'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ 
            mb: 1.5, 
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            {selectedDate ? 
              (isYearly ? 
                format(selectedDate, 'yyyy') : 
                isMonthly ? 
                  format(selectedDate, 'MMMM yyyy') : 
                  format(selectedDate, 'MMMM d, yyyy')
              ) : 'No date'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 'bold' }}>ID:</span> {station?.id || 'Unknown'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 'bold' }}>State:</span> {station?.state || 'Unknown'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 'bold' }}>Elevation:</span> {station?.elevation || '0.0'}m
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 2 }}>
            <span style={{ fontWeight: 'bold' }}>Years:</span> {station?.startYear || '----'} — {station?.endYear || '----'}
          </Typography>
          
          {error && (
            <Alert severity="warning" sx={{ mb: 2, fontSize: '0.75rem', py: 0.5 }}>
              {error}
            </Alert>
          )}
          
          {/* Original rainfall and temperature tubes - removed since they're now in the Detailed Weather Information section */}
          {!showDetailedInfo && (
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
          )}
          
          {/* Detailed weather information section */}
          {showDetailedInfo && weatherDetails && (
            <>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 'bold', 
                  mb: 1.5,
                  textAlign: 'center',
                  color: '#333'
                }}>
                  Detailed Weather Information
                </Typography>
                
                {/* Display data tubes in a 3-row grid */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gridTemplateRows: 'auto auto auto',
                  gap: 1.5, 
                  mb: 2 
                }}>
                  {/* Top Row - Average Rainfall and Temperature */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center' 
                  }}>
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 'bold',
                      color: '#444',
                      mb: 0.5,
                      textAlign: 'center'
                    }}>
                      {rainfallLabel}
                    </Typography>
                    <DataTube 
                      value={rainfallData?.rainfall}
                      unit="mm"
                      fillPercentage={rainfallPercentage}
                      fillColor="rgb(0, 106, 255)"
                      width={55}
                      height={70}
                    />
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.8rem',
                      color: '#555',
                      mt: 0.5,
                      textAlign: 'center'
                    }}>
                      {typeof rainfallData?.rainfall === 'number' ? 
                        rainfallData.rainfall.toFixed(1) + " mm" : 
                        "No data"}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center' 
                  }}>
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 'bold',
                      color: '#444',
                      mb: 0.5,
                      textAlign: 'center'
                    }}>
                      {tempLabel}
                    </Typography>
                    <DataTube 
                      value={{
                        min: temperatureData?.minTemp,
                        max: temperatureData?.maxTemp
                      }}
                      unit="°C"
                      isTemperatureTube={true}
                      minPercentage={minTempPercentage}
                      maxPercentage={maxTempPercentage}
                      width={55}
                      height={70}
                    />
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.8rem',
                      color: '#555',
                      mt: 0.5,
                      textAlign: 'center'
                    }}>
                      {typeof temperatureData?.minTemp === 'number' && typeof temperatureData?.maxTemp === 'number' ? 
                        `${temperatureData.minTemp.toFixed(1)}° - ${temperatureData.maxTemp.toFixed(1)}°` : 
                        "No data"}
                    </Typography>
                  </Box>
                  
                  {/* Middle Row - Rainfall Data */}
                  
                  {/* Total Rainfall with DataTube - Grid Item 1 */}
                  {weatherDetails.totalRainfall !== null && (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center' 
                    }}>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 'bold',
                        color: '#444',
                        mb: 0.5,
                        textAlign: 'center'
                      }}>
                        Total Rainfall
                      </Typography>
                      <DataTube 
                        value={weatherDetails.totalRainfall}
                        unit="mm"
                        fillPercentage={Math.min((weatherDetails.totalRainfall / 1000) * 100, 100)}
                        fillColor="rgb(0, 106, 255)"
                        width={55}
                        height={70}
                      />
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.8rem',
                        color: '#555',
                        mt: 0.5,
                        textAlign: 'center'
                      }}>
                        {weatherDetails.totalRainfall.toFixed(1)} mm
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Highest Rainfall Day with DataTube - Grid Item 2 */}
                  {weatherDetails.highestRainfallDay && (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center' 
                    }}>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 'bold',
                        color: '#444',
                        mb: 0.5,
                        textAlign: 'center'
                      }}>
                        Max Daily Rain
                      </Typography>
                      <DataTube 
                        value={weatherDetails.highestRainfallDay.value}
                        unit="mm"
                        fillPercentage={Math.min((weatherDetails.highestRainfallDay.value / 30) * 100, 100)}
                        fillColor="rgb(0, 106, 255)"
                        width={55}
                        height={70}
                      />
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.8rem',
                        color: '#555',
                        mt: 0.5,
                        textAlign: 'center'
                      }}>
                        {weatherDetails.highestRainfallDay.value.toFixed(1)} mm
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.7rem',
                        fontStyle: 'italic',
                        color: '#666',
                        textAlign: 'center'
                      }}>
                        {format(weatherDetails.highestRainfallDay.date, 'MMM d')}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Bottom Row - Temperature Data */}
                  
                  {/* Highest Temperature with DataTube - Grid Item 3 */}
                  {weatherDetails.highestTemp && (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center' 
                    }}>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 'bold',
                        color: '#444',
                        mb: 0.5,
                        textAlign: 'center'
                      }}>
                        Highest Temp
                      </Typography>
                      <DataTube 
                        value={weatherDetails.highestTemp.value}
                        unit="°C"
                        isThermometerTube={true}
                        width={55}
                        height={70}
                      />
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.8rem',
                        color: '#555',
                        mt: 0.5,
                        textAlign: 'center'
                      }}>
                        {weatherDetails.highestTemp.value.toFixed(1)}°C
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.7rem',
                        fontStyle: 'italic',
                        color: '#666',
                        textAlign: 'center'
                      }}>
                        {format(weatherDetails.highestTemp.date, 'MMM d')}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Lowest Temperature with DataTube - Grid Item 4 */}
                  {weatherDetails.lowestTemp && (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center' 
                    }}>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 'bold',
                        color: '#444',
                        mb: 0.5,
                        textAlign: 'center'
                      }}>
                        Lowest Temp
                      </Typography>
                      <DataTube 
                        value={weatherDetails.lowestTemp.value}
                        unit="°C"
                        isThermometerTube={true}
                        width={55}
                        height={70}
                      />
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.8rem',
                        color: '#555',
                        mt: 0.5,
                        textAlign: 'center'
                      }}>
                        {weatherDetails.lowestTemp.value.toFixed(1)}°C
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.7rem',
                        fontStyle: 'italic',
                        color: '#666',
                        textAlign: 'center'
                      }}>
                        {format(weatherDetails.lowestTemp.date, 'MMM d')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              
              {/* Advanced Statistics Section */}
              {(weatherDetails.precipitationStats || weatherDetails.temperatureStats) && (
                <Box mt={2}>
                  <Box 
                    onClick={() => !forceExpanded && setExpandedStats(!expandedStats)} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: forceExpanded ? 'default' : 'pointer',
                      py: 0.5,
                      backgroundColor: '#f8f8f8',
                      borderRadius: '4px',
                      mb: 1.5
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      Advanced Statistics
                    </Typography>
                    {!forceExpanded && (
                      <Box 
                        component="span" 
                        sx={{ 
                          ml: 1,
                          transform: expandedStats ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '1.2rem',
                          height: '16px',
                          lineHeight: 1,
                          color: '#666'
                        }}
                      >
                        ▼
                      </Box>
                    )}
                  </Box>
                  
                  {(expandedStats || forceExpanded) && (
                    <Box sx={{ pt: 0.5 }}>
                      {/* Precipitation Statistics */}
                      {weatherDetails.precipitationStats && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 'bold', 
                            mb: 1,
                            color: '#444',
                            borderBottom: '1px solid #eee',
                            pb: 0.5
                          }}>
                            Precipitation Stats
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.85rem',
                              color: '#555'
                            }}>
                              <Box component="span" sx={{ fontWeight: 'bold', color: '#444', display: 'inline-block', width: '140px' }}>
                                Rainy Days:
                              </Box> {weatherDetails.precipitationStats.rainyDays}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.85rem',
                              color: '#555'
                            }}>
                              <Box component="span" sx={{ fontWeight: 'bold', color: '#444', display: 'inline-block', width: '140px' }}>
                                Rainfall Intensity:
                              </Box> {formatNumber(weatherDetails.precipitationStats.rainfallIntensity)} mm
                            </Typography>
                            
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.85rem',
                              color: '#555'
                            }}>
                              <Box component="span" sx={{ fontWeight: 'bold', color: '#444', display: 'inline-block', width: '140px' }}>
                                Max Rainy Streak:
                              </Box> {weatherDetails.precipitationStats.maxConsecutiveRainyDays} days
                            </Typography>
                            
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.85rem',
                              color: '#555'
                            }}>
                              <Box component="span" sx={{ fontWeight: 'bold', color: '#444', display: 'inline-block', width: '140px' }}>
                                Max Dry Streak:
                              </Box> {weatherDetails.precipitationStats.maxConsecutiveDryDays} days
                            </Typography>
                            
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.85rem',
                              color: '#555'
                            }}>
                              <Box component="span" sx={{ fontWeight: 'bold', color: '#444', display: 'inline-block', width: '140px' }}>
                                Rainfall Variability:
                              </Box> {formatNumber(weatherDetails.precipitationStats.rainfallVariability)} mm
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {/* Temperature Statistics */}
                      {weatherDetails.temperatureStats && (
                        <Box>
                          <Typography variant="body2" sx={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 'bold', 
                            mb: 1,
                            color: '#444',
                            borderBottom: '1px solid #eee',
                            pb: 0.5
                          }}>
                            Temperature Stats
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.85rem',
                              color: '#555'
                            }}>
                              <Box component="span" sx={{ fontWeight: 'bold', color: '#444', display: 'inline-block', width: '140px' }}>
                                Avg Daily Range:
                              </Box> {formatNumber(weatherDetails.temperatureStats.avgDailyTempRange)}°C
                            </Typography>
                            
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.85rem',
                              color: '#555'
                            }}>
                              <Box component="span" sx={{ fontWeight: 'bold', color: '#444', display: 'inline-block', width: '140px' }}>
                                Temp Variability:
                              </Box> {formatNumber(weatherDetails.temperatureStats.tempVariability)}°C
                            </Typography>
                            
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.85rem',
                              color: '#555'
                            }}>
                              <Box component="span" sx={{ fontWeight: 'bold', color: '#444', display: 'inline-block', width: '140px' }}>
                                Days &gt;30°C:
                              </Box> {weatherDetails.temperatureStats.daysAbove30C}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.85rem',
                              color: '#555'
                            }}>
                              <Box component="span" sx={{ fontWeight: 'bold', color: '#444', display: 'inline-block', width: '140px' }}>
                                Days &lt;0°C:
                              </Box> {weatherDetails.temperatureStats.daysBelow0C}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

export default StationCard;