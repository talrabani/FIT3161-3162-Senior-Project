/*
This is the component for the selected stations box
In this box, when the user selects stations they will appear as cards
The cards will have a constant width and height
The cards will have a close button to remove the station from selection. This button will be on the top right of the card
The cards will have the station name as the title of the card
The cards will have the station id, state, elevation as the subtitle of the card
The rainfall and temperature data for the current selected date in MapSidebar will be displayed in the card as text
*/

import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import StationCard from './stationCard';

const onRemoveStation = (station) => {
  console.log('Removing station:', station);
};

const SelectedStationsBox = ({ selectedStations, onRemoveStation, selectedDate }) => {
  return (
    <Card sx={{ 
      p: 1, 
      bgcolor: '#f9f9f9',
      borderRadius: '12px'
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>Selected Stations</Typography>
        <Typography variant="body2" color="text.secondary" mt={1} mb={2}>
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
  );
};

export default SelectedStationsBox;