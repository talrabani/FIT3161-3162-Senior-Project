import React, { useState, useEffect } from 'react';
import { P } from './typography';
import { useMapContext } from '../../context/MapContext';
import { fetchAverageRainfallBySA4, fetchSA4Summary } from '../../services/weatherApi';

/**
 * Debug Information Panel
 * Displays various debug information and controls for the application
 */
const DebugInfo = ({
  selectedLocations = [],
  showSA4Boundaries = true,
  setShowSA4Boundaries = () => {},
  showStations = true,
  setShowStations = () => {},
  dateRange = { startDate: '', endDate: '' },
  isLoading = false,
  isError = false
}) => {
  // Get selectedDate and selectedSA4 from the context
  const { selectedDate, selectedSA4 } = useMapContext();
  
  // State for SA4 rainfall data
  const [sa4RainfallData, setSa4RainfallData] = useState([]);
  const [sa4Information, setSa4Information] = useState([]);
  const [isLoadingRainfall, setIsLoadingRainfall] = useState(false);
  const [rainfallError, setRainfallError] = useState(null);
  
  // Format selected date for display
  const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : 'Not set';
  
  // Extract month and year from the selected date
  const selectedMonth = selectedDate ? String(selectedDate.getMonth() + 1).padStart(2, '0') : null; // +1 because getMonth() returns 0-11
  const selectedYear = selectedDate ? selectedDate.getFullYear().toString() : null;
  
  // Fetch SA4 information once on component mount
  useEffect(() => {
    const fetchSA4Info = async () => {
      try {
        const data = await fetchSA4Summary();
        setSa4Information(data);
      } catch (error) {
        console.error('Error fetching SA4 information:', error);
      }
    };
    
    fetchSA4Info();
  }, []);
  
  // Fetch rainfall data when the selected date changes
  useEffect(() => {
    if (!selectedMonth || !selectedYear) return;
    
    const fetchRainfallData = async () => {
      setIsLoadingRainfall(true);
      setRainfallError(null);
      
      try {
        const data = await fetchAverageRainfallBySA4(selectedMonth, selectedYear);
        setSa4RainfallData(data);
      } catch (error) {
        console.error('Error fetching SA4 rainfall data:', error);
        setRainfallError('Failed to fetch rainfall data');
        setSa4RainfallData([]);
      } finally {
        setIsLoadingRainfall(false);
      }
    };
    
    fetchRainfallData();
  }, [selectedMonth, selectedYear]);
  
  // Combine rainfall data with SA4 information
  const combinedRainfallData = sa4RainfallData.map(rainfallItem => {
    const sa4Info = sa4Information.find(item => item.code === rainfallItem.sa4_code);
    return {
      sa4_code: rainfallItem.sa4_code,
      sa4_name: sa4Info?.name || 'Unknown',
      state: sa4Info?.state || 'Unknown',
      avg_rainfall: rainfallItem.rainfall,
      avg_max_temp: rainfallItem.max_temp,
      avg_min_temp: rainfallItem.min_temp
    };
  });
  
  return (
    <div className="alert alert-info mb-4 text-start">
      <h4 className="alert-heading">Debug Information</h4>
      
      <div className="mb-3">
        <div className="btn-group">
          <button 
            className={`btn btn-sm ${showSA4Boundaries ? 'btn-success' : 'btn-outline-secondary'}`}
            onClick={() => setShowSA4Boundaries(!showSA4Boundaries)}
          >
            {showSA4Boundaries ? 'Hide SA4 Boundaries' : 'Show SA4 Boundaries'}
          </button>
          <button 
            className={`btn btn-sm ${showStations ? 'btn-success' : 'btn-outline-secondary'}`}
            onClick={() => setShowStations(!showStations)}
          >
            {showStations ? 'Hide Stations' : 'Show Stations'}
          </button>
        </div>
      </div>
      
      <p>Selected Locations: {selectedLocations.length}</p>
      <ul>
        {selectedLocations.map(loc => (
          <li key={loc.name}>
            {loc.name} ({loc.latitude}, {loc.longitude})
          </li>
        ))}
      </ul>
      <p>Selected Date: {formattedDate}</p>
      <p>Date Range: {dateRange.startDate} to {dateRange.endDate}</p>
      <p>Selected SA4: {selectedSA4 || 'None'}</p>
      <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      <p>Error: {isError ? 'Yes' : 'No'}</p>
      
      <div className="mt-4">
        <h5>Average Rainfall by SA4 - {selectedMonth}/{selectedYear}</h5>
        {isLoadingRainfall ? (
          <p>Loading rainfall data...</p>
        ) : rainfallError ? (
          <p className="text-danger">{rainfallError}</p>
        ) : combinedRainfallData.length > 0 ? (
          <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="table table-sm table-striped table-hover">
              <thead>
                <tr>
                  <th>SA4 Code</th>
                  <th>SA4 Name</th>
                  <th>State</th>
                  <th>Average Rainfall (mm)</th>
                  <th>Average Max Temp (°C)</th>
                  <th>Average Min Temp (°C)</th>
                </tr>
              </thead>
              <tbody>
                {combinedRainfallData.map(item => (
                  <tr key={item.sa4_code} className={selectedSA4 === item.sa4_code ? 'table-primary' : ''}>
                    <td>{item.sa4_code}</td>
                    <td>{item.sa4_name}</td>
                    <td>{item.state}</td>
                    <td>{item.avg_rainfall ? Number(item.avg_rainfall).toFixed(2) : 'N/A'}</td>
                    <td>{item.avg_max_temp ? Number(item.avg_max_temp).toFixed(2) : 'N/A'}</td>
                    <td>{item.avg_min_temp ? Number(item.avg_min_temp).toFixed(2) : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No rainfall data available for this month/year</p>
        )}
      </div>
    </div>
  );
};

export default DebugInfo;
