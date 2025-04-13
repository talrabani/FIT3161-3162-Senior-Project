// This is the component for the station select card when the user clicks on a station on the map

import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';

/**
 * Station Select Card Component
 * Displays information about a selected station and provides options to interact with it
 * 
 * @param {Object} station - The selected station data
 * @param {Function} onClose - Function to call when the card is closed
 * @param {Function} onSelect - Function to call when the station is selected
 */
const StationSelectCard = ({ station, onClose, onSelect }) => {
  if (!station) return null;

  const handleSelect = () => {
    if (onSelect) {
      onSelect(station);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <Card 
        sx={{ 
          width: '100%', 
          maxWidth: 300,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          borderRadius: '8px',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid white'
          }
        }}
      >
        <CardContent sx={{ padding: '12px 16px' }}>
          <Typography variant="h6" component="div" gutterBottom sx={{ fontSize: '1rem', mb: 1 }}>
            {station.station_name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
            ID: {station.station_id}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
            State: {station.station_state}
          </Typography>
          
          {station.station_height && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
              Elevation: {station.station_height}m
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
            Years: {station.station_start_year || 'N/A'} - {station.station_end_year || 'Present'}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button 
              size="small" 
              color="primary" 
              variant="contained"
              onClick={handleSelect}
              sx={{ fontSize: '0.8rem', py: 0.5 }}
            >
              Select Station
            </Button>
            
            <Button 
              size="small" 
              color="secondary"
              onClick={onClose}
              sx={{ fontSize: '0.8rem', py: 0.5 }}
            >
              Close
            </Button>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

export default StationSelectCard;



