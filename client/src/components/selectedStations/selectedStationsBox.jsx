/*
This is the component for the selected stations box
In this box, when the user selects stations they will appear as cards
The cards will have a constant width and height
The cards will have a close button to remove the station from selection. This button will be on the top right of the card
The cards will have the station name as the title of the card
The cards will have the station id, state, elevation as the subtitle of the card
The rainfall and temperature data for the current selected date in MapSidebar will be displayed in the card as text
*/

import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StationCard from './stationCard';
import { useMapContext } from '../../context/MapContext';

const SelectedStationsBox = ({ selectedStations, onRemoveStation, clearAllStations }) => {
  // Get the selected date from the context
  const { selectedDate, setDateRange } = useMapContext();
  const [expandAllStats, setExpandAllStats] = useState(false);
  
  // Setup navigation
  const navigate = useNavigate();
  
  // Handle Compare button click - navigate to comparison page
  const handleCompare = () => {
    console.log('Navigate to comparison page');
    // No need to explicitly save to localStorage as the useWeatherData hook handles this
    navigate('/comparison');
  };
  
  // Remove All button
  const handleRemoveAll = () => {
    console.log('Remove All button clicked');
    // Call the clearAllStations function passed from the parent
    if (clearAllStations) {
      clearAllStations();
    } else {
      // Fallback if clearAllStations not provided - call onRemoveStation for each
      selectedStations.forEach(station => {
        onRemoveStation(station.name);
      });
    }
    
    // Reset date range
    setDateRange({ startDate: null, endDate: null });
  };
  
  // Toggle Expand All button
  const handleExpandAll = () => {
    console.log('Expand All button clicked, current state:', expandAllStats);
    setExpandAllStats(!expandAllStats);
  };
  
  return (
    <Card sx={{ 
      p: 1, 
      bgcolor: 'var(--card-bg, #ffffff)',
      borderRadius: '12px',
      boxShadow: 'var(--card-shadow, 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1))'
    }}>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
            Selected Stations
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Button 
              variant="contained" 
              color="primary" 
              size="small"
              disabled={selectedStations.length < 2}
              onClick={handleCompare}
              sx={{ fontSize: '0.8rem' }}
            >
              Generate Graph
            </Button>
            
            <Button 
              variant={expandAllStats ? "contained" : "outlined"}
              color="info" 
              size="small"
              disabled={selectedStations.length === 0}
              onClick={handleExpandAll}
              sx={{ fontSize: '0.8rem' }}
            >
              {expandAllStats ? "Collapse" : "Expand"} All
            </Button>
            
            <Button 
              variant="outlined" 
              color="error" 
              size="small"
              disabled={selectedStations.length === 0}
              onClick={handleRemoveAll}
              sx={{ fontSize: '0.8rem' }}
            >
              Remove All
            </Button>
          </Stack>
        </Box>
        
        <Typography variant="body2" color="text.secondary" mb={2}>
          {selectedStations.length === 0 
            ? 'No stations selected. Click on stations on the map to select them.' 
            : `${selectedStations.length} station(s) selected`}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'wrap', 
          gap: 2,
          justifyContent: 'flex-start',
        }}>
          {selectedStations.map(station => (
            <StationCard 
              key={station.id || station.name} 
              station={station} 
              onRemove={onRemoveStation}
              selectedDate={selectedDate}
              forceExpanded={expandAllStats}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SelectedStationsBox;