import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { useMapContext } from '../../context/MapContext';
import { format, endOfMonth, endOfYear } from 'date-fns';
import { fetchStationWeatherRange, fetchStationWeatherAggregated } from '../../services/weatherApi';
import { getStationColor } from './utils/colorUtils';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

// Import our components
import GraphTools from './GraphTools';
import GraphDisplay from './GraphDisplay';
import SaveGraphOptions from './SaveGraphOptions';
import TemperatureRangeGraph from './TemperatureRangeGraph'; // We'll create this new component

/**
 * CompareStationsBox Component
 * Displays the comparison chart interface with date selectors and a D3.js line graph
 * 
 * @param {Array} stationsToCompare - The stations being compared
 */
const CompareStationsBox = ({ stationsToCompare }) => {
  const { selectedDate, dateRange, setDateRange, selectedType } = useMapContext();
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState({});
  const [error, setError] = useState(null);
  
  // Weather type options
  const WEATHER_TYPES = {
    RAINFALL: 'rainfall',
    MAX_TEMP: 'max_temp',
    MIN_TEMP: 'min_temp',
    TEMP_RANGE: 'temp_range' // New option for temperature range
  };
  
  // Set the graph type locally (not using the global state)
  const [selectedGraphType, setSelectedGraphType] = useState(selectedType);
  
  // Set the data frequency (daily, monthly, yearly)
  const [frequency, setFrequency] = useState('daily');
  
  // Handle changes in the date range - this updates the context
  const handleStartDateChange = (newDate) => {
    setDateRange(prev => ({ ...prev, startDate: newDate }));
    console.log('Start Date updated:', newDate);
  };

  const handleEndDateChange = (newDate) => {
    setDateRange(prev => ({ ...prev, endDate: newDate }));
    console.log('End Date updated:', newDate);
  };
  
  // Handle weather type change - this updates the local state only
  const handleTypeChange = (event) => {
    setSelectedGraphType(event.target.value);
    console.log('Selected graph type updated:', event.target.value);
  };
  
  // Handle frequency change
  const handleFrequencyChange = (newFrequency) => {
    setFrequency(newFrequency);
    console.log('Frequency updated:', newFrequency);
  };

  // Fetch data for comparison when stations or date range changes
  useEffect(() => {
    const fetchComparisonData = async () => {
      // Ensure we have start and end dates
      if (!dateRange.startDate) {
        setDateRange(prev => ({
          ...prev,
          startDate: selectedDate
        }));
        return;
      }
      
      if (!dateRange.endDate) {
        setDateRange(prev => ({
          ...prev,
          endDate: new Date(new Date(selectedDate).setDate(selectedDate.getDate() + 4))
        }));
        return;
      }
      
      if (!stationsToCompare || stationsToCompare.length < 2) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Adjust end date to be inclusive of the entire period for monthly/yearly frequencies
        let adjustedEndDate = dateRange.endDate;
        if (frequency === 'monthly') {
          // Make end date the last day of the selected month
          adjustedEndDate = endOfMonth(dateRange.endDate);
        } else if (frequency === 'yearly') {
          // Make end date December 31st of the selected year
          adjustedEndDate = endOfYear(dateRange.endDate);
        }
        
        console.log('Fetching comparison data for:');
        console.log('Stations:', stationsToCompare.map(s => s.name).join(', '));
        console.log('Date range:', format(dateRange.startDate, 'yyyy-MM-dd'), 'to', format(adjustedEndDate, 'yyyy-MM-dd'));
        console.log('Frequency:', frequency);
        console.log('Graph type:', selectedGraphType);
        
        // For temperature range, we need to fetch both min and max temperature data
        const needsBothTemps = selectedGraphType === WEATHER_TYPES.TEMP_RANGE;
        
        // Dictionary to store station data
        const stationData = {};

        // Fetch data for each station
        for (const station of stationsToCompare) {
          let data;
          
          if (frequency === 'daily') {
            // For daily data, use the existing endpoint
            data = await fetchStationWeatherRange(
              station.id, 
              dateRange.startDate, 
              dateRange.endDate
            );
          } else {
            // For monthly or yearly, use the aggregation endpoint with adjusted end date
            const dataType = needsBothTemps ? 'both_temps' : selectedGraphType;
            data = await fetchStationWeatherAggregated(
              station.id, 
              dateRange.startDate, 
              adjustedEndDate,
              frequency,
              dataType
            );
          }
          
          stationData[station.id] = {
            id: station.id,
            name: station.name,
            color: getStationColor(station.id),
            data: data
          };
        }

        // Set the fetched data
        setComparisonData(stationData);
      } catch (err) {
        console.error('Error fetching comparison data:', err);
        setError('Failed to fetch comparison data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComparisonData();
  }, [stationsToCompare, dateRange.startDate, dateRange.endDate, selectedGraphType, selectedDate, setDateRange, frequency]);

  // Determine if we have data to display/download
  const hasData = comparisonData && Object.keys(comparisonData).length > 0;

  // Custom type selector for comparison page
  const renderTypeSelector = () => (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel id="weather-type-select-label">Weather Type</InputLabel>
      <Select
        labelId="weather-type-select-label"
        id="weather-type-select"
        value={selectedGraphType}
        label="Weather Type"
        onChange={handleTypeChange}
      >
        <MenuItem value={WEATHER_TYPES.RAINFALL}>Rainfall</MenuItem>
        <MenuItem value={WEATHER_TYPES.MAX_TEMP}>Maximum Temperature</MenuItem>
        <MenuItem value={WEATHER_TYPES.MIN_TEMP}>Minimum Temperature</MenuItem>
        <MenuItem value={WEATHER_TYPES.TEMP_RANGE}>Temperature Range</MenuItem>
      </Select>
    </FormControl>
  );

  return (
    <Fragment>
      {/* Graph Settings Panel */}
      <GraphTools 
        customTypeSelector={renderTypeSelector()}  
        dateRange={dateRange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        frequency={frequency}
        onFrequencyChange={handleFrequencyChange}
      />
      
      {/* Graph Visualization */}
      {selectedGraphType === WEATHER_TYPES.TEMP_RANGE ? (
        <TemperatureRangeGraph
          stationData={comparisonData}
          loading={loading}
          error={error}
          height={400}
          frequency={frequency}
        />
      ) : (
        <GraphDisplay 
          stationData={comparisonData}
          selectedType={selectedGraphType}
          loading={loading}
          error={error}
          frequency={frequency}
        />
      )}
      
      {/* Download Options */}
      <SaveGraphOptions
        hasData={hasData}
        comparisonData={comparisonData}
        graphType={selectedGraphType}
        frequency={frequency}/>
    </Fragment>
  );
};

export default CompareStationsBox;
