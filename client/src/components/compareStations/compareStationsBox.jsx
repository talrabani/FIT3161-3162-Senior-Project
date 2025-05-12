import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { useMapContext } from '../../context/MapContext';
import { format } from 'date-fns';
import { fetchStationWeatherRange } from '../../services/weatherApi';
import { getStationColor } from './utils/colorUtils';

// Import our new components
import GraphTools from './GraphTools';
import GraphDisplay from './GraphDisplay';
import SaveGraphOptions from './SaveGraphOptions';

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
  
  // Set the graph type, which is separate to one on the map
  const [selectedGraphType, setSelectedType] = useState(selectedType.valueOf());
  
  // Handle changes in the date range - this updates the context
  const handleStartDateChange = (newDate) => {
    setDateRange(prev => ({ ...prev, startDate: newDate }));
    console.log('Start Date updated:', newDate);
  };

  const handleEndDateChange = (newDate) => {
    setDateRange(prev => ({ ...prev, endDate: newDate }));
    console.log('End Date updated:', newDate);
  };
  
  // Handle type change - this updates the context
  const handleTypeChange = (newType) => {
    setSelectedType(newType);
    console.log('Selected type updated:', newType);
  };

  // Fetch data for comparison when stations or date range changes
  useEffect(() => {
    const fetchComparisonData = async () => {
      setDateRange({
        startDate: (!dateRange.startDate)? selectedDate : dateRange.startDate,
        endDate: (!dateRange.endDate)? new Date(new Date(selectedDate).setDate(selectedDate.getDate()+4)) : dateRange.endDate
      });
      
      if (!stationsToCompare || stationsToCompare.length < 2) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching comparison data for:');
        console.log('Stations:', stationsToCompare.map(s => s.name).join(', '));
        console.log('Date range:', format(dateRange.startDate, 'yyyy-MM-dd'), 'to', format(dateRange.endDate, 'yyyy-MM-dd'));
        
        // Dictionary to store station data
        const stationData = {};

        // Fetch data for each station
        for (const station of stationsToCompare) {
          const data = await fetchStationWeatherRange(station.id, dateRange.startDate, dateRange.endDate);
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
  }, [stationsToCompare, dateRange.startDate, dateRange.endDate, selectedGraphType, selectedDate, setDateRange]);

  // Determine if we have data to display/download
  const hasData = comparisonData && Object.keys(comparisonData).length > 0;

  return (
    <Fragment>
      {/* Graph Settings Panel */}
      <GraphTools 
        selectedType={selectedGraphType}
        onTypeChange={handleTypeChange}
        dateRange={dateRange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
      />
      
      {/* Graph Visualization */}
      <GraphDisplay 
        stationData={comparisonData}
        selectedType={selectedGraphType}
        loading={loading}
        error={error}
      />
      
      {/* Download Options */}
      <SaveGraphOptions hasData={hasData} />
    </Fragment>
  );
};

export default CompareStationsBox;
