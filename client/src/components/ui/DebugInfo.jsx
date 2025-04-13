import React from 'react';
import { P } from './typography';

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
  chartType = '',
  isLoading = false,
  isError = false
}) => {
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
      <p>Date Range: {dateRange.startDate} to {dateRange.endDate}</p>
      <p>Chart Type: {chartType}</p>
      <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      <p>Error: {isError ? 'Yes' : 'No'}</p>
    </div>
  );
};

export default DebugInfo;
