import React, { createContext, useContext, useState } from 'react';

// Create the context
const MapContext = createContext();

// Custom hook for using the context
export const useMapContext = () => useContext(MapContext);

// Provider component
export const MapContextProvider = ({ children }) => {
  // State from MapSidebar that needs to be shared
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSA4, setSelectedSA4] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [selectedStations, setSelectedStations] = useState([]);
  
  // Value to be provided to consuming components
  const value = {
    // Date related
    selectedDate,
    setSelectedDate,
    dateRange,
    setDateRange,
    isRangeMode, 
    setIsRangeMode,
    
    // Location related
    selectedSA4,
    setSelectedSA4,
    
    // Station related
    selectedStations,
    setSelectedStations,
    
    // Helper methods
    addStation: (station) => {
      setSelectedStations(prev => {
        // Check if station already exists to avoid duplicates
        if (!prev.some(s => s.id === station.id)) {
          return [...prev, station];
        }
        return prev;
      });
    },
    
    removeStation: (stationName) => {
      setSelectedStations(prev => 
        prev.filter(s => s.name !== stationName)
      );
    }
  };
  
  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

export default MapContext; 