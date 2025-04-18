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
import StationCard from './stationCard';
import { useMapContext } from '../../context/MapContext';
import CompareStationsBox from '../compareStations/compareStationsBox';

const onRemoveStation = (station) => {
  console.log('Removing station:', station);
};

const SelectedStationsBox = ({ selectedStations, onRemoveStation }) => {
  // Get the selected date from the context
  const { selectedDate } = useMapContext();
  const [showComparison, setShowComparison] = useState(false);
  
  // Handle Compare button click
  const handleCompare = () => {
    console.log('Compare button clicked');
    setShowComparison(true);
  };
  
  // Remove All button
  const handleRemoveAll = () => {
    console.log('Remove All button clicked');
    // Could call onRemoveStation for each station
    selectedStations.forEach(station => {
      onRemoveStation(station.name);
    });
    // Hide comparison if all stations are removed
    setShowComparison(false);
  };
  
  return (
    <>
      <Card sx={{ 
        p: 1, 
        bgcolor: '#f9f9f9',
        borderRadius: '12px'
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
                Compare
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
              />
            ))}
          </Box>
        </CardContent>
      </Card>
      
      {/* Display comparison box when Compare button is clicked and there are at least 2 stations */}
      {showComparison && selectedStations.length >= 2 && (
        <CompareStationsBox stationsToCompare={selectedStations} />
      )}
    </>
  );
};

export default SelectedStationsBox;