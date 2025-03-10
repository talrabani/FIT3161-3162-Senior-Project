import { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { H3, P, Muted } from '../ui/typography';
import { weatherCodes } from '../../services/weatherApi';

const CHART_COLORS = {
  temperature: ['#ff7300', '#8884d8', '#82ca9d'],
  rainfall: ['#0088FE', '#00C49F', '#FFBB28']
};

/**
 * Weather Chart Component
 * Displays temperature or rainfall data for selected locations
 */
export default function WeatherChart({ weatherData, chartType = 'temperature' }) {
  const [timeFrame, setTimeFrame] = useState('monthly'); // 'monthly' or 'daily'
  const [dataSource, setDataSource] = useState('historical'); // 'historical' or 'forecast'
  
  // Log the incoming weatherData for debugging
  console.log('WeatherChart received data:', 
    weatherData?.map(data => ({
      location: data.location.name,
      hasHistorical: !!data.historicalData,
      hasForecast: !!data.forecastData,
      hasObservations: !!data.observationData?.data?.length,
      isLoading: data.isLoading,
      isError: data.isError
    }))
  );
  
  if (!weatherData?.length) {
    return (
      <div className="card h-100 d-flex align-items-center justify-content-center p-4">
        <div className="card-body text-center">
          <P>Select locations on the map to see weather data</P>
        </div>
      </div>
    );
  }
  
  // Show a loading indicator instead of trying to render partial data
  if (weatherData.some(data => data.isLoading)) {
    return (
      <div className="card">
        <div className="card-header">
          <H3 className="mb-0">Loading Data...</H3>
        </div>
        <div className="card-body d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary me-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <P>Loading weather data for selected locations...</P>
        </div>
      </div>
    );
  }
  
  // Check if data is available for charting
  const hasData = weatherData.some(data => 
    (dataSource === 'historical' && data.historicalData?.daily?.time?.length > 0) || 
    (dataSource === 'forecast' && data.forecastData?.daily?.time?.length > 0)
  );
  
  if (!hasData) {
    return (
      <div className="card">
        <div className="card-header">
          <H3 className="mb-0">{chartType === 'temperature' ? 'Temperature Comparison' : 'Rainfall Comparison'}</H3>
        </div>
        <div className="card-body text-center" style={{ minHeight: '400px' }}>
          <div className="alert alert-warning mt-4">
            <p className="mb-0">No data available for the selected locations and time period.</p>
            <p className="mb-0 mt-2">Try selecting different locations or adjusting the date range.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Prepare chart data
  const prepareChartData = () => {
    // If no data or loading
    if (!weatherData || weatherData.some(data => 
        (dataSource === 'historical' && !data.historicalData) || 
        (dataSource === 'forecast' && !data.forecastData) || 
        data.isLoading)) {
      return [];
    }
    
    try {
      // Using forecast data
      if (dataSource === 'forecast') {
        // Make sure we have forecast data for the first location
        if (!weatherData[0]?.forecastData?.daily?.time?.length) {
          return [];
        }
      
        // For temperature chart
        if (chartType === 'temperature') {
          return weatherData[0].forecastData.daily.time.map((date, index) => {
            const dataPoint = { date };
            
            weatherData.forEach((locationData, locationIndex) => {
              // Skip if data is missing
              if (!locationData?.forecastData?.daily?.temperature_2m_max) return;
              
              const locationName = locationData.location.name;
              dataPoint[`max_${locationName}`] = locationData.forecastData.daily.temperature_2m_max[index];
              dataPoint[`min_${locationName}`] = locationData.forecastData.daily.temperature_2m_min[index];
              
              // Add weather condition if available
              if (locationData.forecastData.daily.weathercode) {
                const code = locationData.forecastData.daily.weathercode[index];
                dataPoint[`weather_${locationName}`] = weatherCodes[code] || 'Unknown';
              }
            });
            
            return dataPoint;
          });
        }
        
        // For rainfall chart
        if (chartType === 'rainfall') {
          return weatherData[0].forecastData.daily.time.map((date, index) => {
            const dataPoint = { date };
            
            weatherData.forEach((locationData) => {
              // Skip if data is missing
              if (!locationData?.forecastData?.daily?.precipitation_sum) return;
              
              const locationName = locationData.location.name;
              dataPoint[locationName] = locationData.forecastData.daily.precipitation_sum[index];
            });
            
            return dataPoint;
          });
        }
      }
      
      // Using historical data
      // Make sure we have historical data for the first location
      if (!weatherData[0]?.historicalData?.daily?.time?.length) {
        return [];
      }
      
      // For temperature chart
      if (chartType === 'temperature') {
        // Daily view
        if (timeFrame === 'daily') {
          return weatherData[0].historicalData.daily.time.map((date, index) => {
            const dataPoint = { date };
            
            weatherData.forEach((locationData, locationIndex) => {
              // Skip if data is missing
              if (!locationData?.historicalData?.daily?.temperature_2m_max) return;
              
              const locationName = locationData.location.name;
              dataPoint[`max_${locationName}`] = locationData.historicalData.daily.temperature_2m_max[index];
              dataPoint[`min_${locationName}`] = locationData.historicalData.daily.temperature_2m_min[index];
            });
            
            return dataPoint;
          });
        }
        
        // Monthly aggregation
        const monthlyData = {};
        
        weatherData.forEach(locationData => {
          // Skip if data is missing
          if (!locationData?.historicalData?.daily?.time) return;
          
          locationData.historicalData.daily.time.forEach((date, index) => {
            const month = date.substring(0, 7); // YYYY-MM
            
            if (!monthlyData[month]) {
              monthlyData[month] = { 
                month,
                count: 0
              };
              
              // Initialize temperature fields for each location
              weatherData.forEach(ld => {
                monthlyData[month][`max_${ld.location.name}`] = 0;
                monthlyData[month][`min_${ld.location.name}`] = 0;
              });
            }
            
            monthlyData[month][`max_${locationData.location.name}`] += locationData.historicalData.daily.temperature_2m_max[index];
            monthlyData[month][`min_${locationData.location.name}`] += locationData.historicalData.daily.temperature_2m_min[index];
            monthlyData[month].count += 1;
          });
        });
        
        // Calculate averages
        return Object.values(monthlyData)
          .map(month => {
            weatherData.forEach(ld => {
              month[`max_${ld.location.name}`] = +(month[`max_${ld.location.name}`] / month.count).toFixed(1);
              month[`min_${ld.location.name}`] = +(month[`min_${ld.location.name}`] / month.count).toFixed(1);
            });
            return month;
          })
          .sort((a, b) => a.month.localeCompare(b.month));
      }
      
      // For rainfall chart
      if (chartType === 'rainfall') {
        // Daily view
        if (timeFrame === 'daily') {
          return weatherData[0].historicalData.daily.time.map((date, index) => {
            const dataPoint = { date };
            
            weatherData.forEach((locationData) => {
              // Skip if data is missing
              if (!locationData?.historicalData?.daily?.precipitation_sum) return;
              
              const locationName = locationData.location.name;
              dataPoint[locationName] = locationData.historicalData.daily.precipitation_sum[index];
            });
            
            return dataPoint;
          });
        }
        
        // Monthly aggregation
        const monthlyData = {};
        
        weatherData.forEach(locationData => {
          // Skip if data is missing
          if (!locationData?.historicalData?.daily?.time) return;
          
          locationData.historicalData.daily.time.forEach((date, index) => {
            const month = date.substring(0, 7); // YYYY-MM
            
            if (!monthlyData[month]) {
              monthlyData[month] = { 
                month
              };
              
              // Initialize rainfall fields for each location
              weatherData.forEach(ld => {
                monthlyData[month][ld.location.name] = 0;
              });
            }
            
            monthlyData[month][locationData.location.name] += locationData.historicalData.daily.precipitation_sum[index];
          });
        });
        
        // Sort by month
        return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
      }
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return [];
    }
    
    return [];
  };
  
  const chartData = prepareChartData();
  
  // Format date for X-axis
  const formatXAxis = (value) => {
    if (timeFrame === 'monthly' && dataSource === 'historical') {
      // Format YYYY-MM to MMM YYYY
      const [year, month] = value.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    
    // Format YYYY-MM-DD to DD MMM
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };
  
  // Get the current observations for all locations
  const currentObservations = weatherData
    .filter(data => data.observationData?.data?.length > 0)
    .map(data => {
      const location = data.location.name;
      const observations = data.observationData.data[0];
      
      // Extract relevant data from observations
      return {
        location,
        temperature: observations.air_temp,
        humidity: observations.rel_hum,
        rainfall: observations.rain_trace,
        windSpeed: observations.wind_spd_kmh,
        windDirection: observations.wind_dir,
        pressure: observations.press,
        updatedAt: observations.local_date_time_full
      };
    });
  
  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <H3 className="mb-0">{chartType === 'temperature' ? 'Temperature Comparison' : 'Rainfall Comparison'}</H3>
        
        <div className="btn-group">
          <button 
            className={`btn ${timeFrame === 'monthly' && dataSource === 'historical' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => { setTimeFrame('monthly'); setDataSource('historical'); }}
            disabled={dataSource === 'forecast'}
          >
            Monthly
          </button>
          <button 
            className={`btn ${timeFrame === 'daily' && dataSource === 'historical' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => { setTimeFrame('daily'); setDataSource('historical'); }}
            disabled={dataSource === 'forecast'}
          >
            Daily
          </button>
          <button 
            className={`btn ${dataSource === 'forecast' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setDataSource('forecast')}
          >
            Forecast
          </button>
        </div>
      </div>
      
      {/* Current observations panel */}
      {currentObservations.length > 0 && (
        <div className="card-body bg-light">
          <div className="row mb-3">
            <div className="col-12">
              <h5 className="mb-3">Current Weather Conditions</h5>
            </div>
            
            {currentObservations.map((obs) => (
              <div key={obs.location} className="col-md-4 mb-3">
                <div className="card h-100">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">{obs.location}</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Temperature:</span>
                      <strong>{obs.temperature}°C</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Humidity:</span>
                      <strong>{obs.humidity}%</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Rainfall:</span>
                      <strong>{obs.rainfall} mm</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Wind:</span>
                      <strong>{obs.windSpeed} km/h {obs.windDirection}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Pressure:</span>
                      <strong>{obs.pressure} hPa</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="card-body">
        {weatherData.some(data => data.isLoading) ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <P className="ms-3 mb-0">Loading data...</P>
          </div>
        ) : chartData.length === 0 ? (
          <div className="alert alert-info" role="alert">
            No data available for the selected time period and locations.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'temperature' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={timeFrame === 'monthly' && dataSource === 'historical' ? 'month' : 'date'} 
                  tickFormatter={formatXAxis}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value, name) => {
                    const locationName = name.split('_')[1] || name;
                    const prefix = name.startsWith('max_') ? 'Max ' : name.startsWith('min_') ? 'Min ' : '';
                    return [`${value} °C`, `${prefix}${locationName}`];
                  }}
                  labelFormatter={formatXAxis}
                />
                <Legend />
                {weatherData.map((location, index) => (
                  <>
                    <Line 
                      key={`max-${location.location.name}`}
                      type="monotone"
                      dataKey={`max_${location.location.name}`}
                      name={`max_${location.location.name}`}
                      stroke={CHART_COLORS.temperature[index]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      key={`min-${location.location.name}`}
                      type="monotone"
                      dataKey={`min_${location.location.name}`}
                      name={`min_${location.location.name}`}
                      stroke={CHART_COLORS.temperature[index]}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                    />
                  </>
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={timeFrame === 'monthly' && dataSource === 'historical' ? 'month' : 'date'} 
                  tickFormatter={formatXAxis}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value) => [`${value} mm`, '']}
                  labelFormatter={formatXAxis}
                />
                <Legend />
                {weatherData.map((location, index) => (
                  <Bar 
                    key={location.location.name}
                    dataKey={location.location.name}
                    name={location.location.name}
                    fill={CHART_COLORS.rainfall[index]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="card-footer text-center text-muted">
        <Muted>
          Data source: Australian Bureau of Meteorology via Open-Meteo
        </Muted>
      </div>
    </div>
  );
} 