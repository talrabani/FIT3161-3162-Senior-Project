import React, { createContext, useContext, useState } from 'react';

// Create the context
const MapContext = createContext();

// Custom hook for using the context
export const useMapContext = () => useContext(MapContext);

// Provider component
export const MapContextProvider = ({ children }) => {
  // State from MapSidebar that needs to be shared
  const [selectedDate, setSelectedDate] = useState(new Date(2000, 0, 1)); // Jan 1, 2000
  const [selectedSA4, setSelectedSA4] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [selectedStations, setSelectedStations] = useState([]);
  const [timeFrequency, setFrequency] = useState(['day', 'month', 'year']);
  // const [startRect, setStartRect] = useState(false);
  // const [currentMousePos, setMousePos] = useState(null);
  
  // Selected station from map or search
  const [selectedMapStation, setSelectedMapStation] = useState(null);
  
  // Weather visualization settings - default to rainfall
  const [selectedType, setSelectedType] = useState('rainfall');
  
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
    
    // Currently selected station on map
    selectedMapStation,
    setSelectedMapStation,
    
    // Station related
    selectedStations,
    setSelectedStations,
    
    // Weather visualization
    selectedType,
    setSelectedType,
    
    // Daily, Monthly, or Yearly
    timeFrequency,
    setFrequency,
    // User selects region
    // startRect,
    // setStartRect,
    // currentMousePos,
    // setMousePos,
    
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
    },
    
    // Helper method to clear the selected map station
    clearSelectedMapStation: () => {
      setSelectedMapStation(null);
    }
  };
  
  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

export default MapContext; 