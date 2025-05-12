/*
This is the component for the selected stations box
In this box, when the user selects stations they will appear as cards
The cards will have a constant width and height
The cards will have a close button to remove the station from selection. This button will be on the top right of the card
The cards will have the station name as the title of the card
The cards will have the station id, state, elevation as the subtitle of the card
The rainfall and temperature data for the current selected date in MapSidebar will be displayed in the card as text
*/

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Divider } from '@mui/material';
import { useMapContext } from '../../context/MapContext';
import StationCard from './stationCard';

/**
 * SelectedStationsBox Component
 * Displays a box with stations selected by the user on the map
 * 
 * @param {Object} props - Component props
 * @param {Function} props.formatTemperature - Function to format temperature values with units
 * @param {Function} props.formatRainfall - Function to format rainfall values with units
 */
const SelectedStationsBox = ({ formatTemperature, formatRainfall }) => {
  const [expanded, setExpanded] = useState(false);
  const { selectedStations, removeStation, selectedDate } = useMapContext();

  // Reset expansion when no stations are selected
  useEffect(() => {
    if (selectedStations.length === 0) {
      setExpanded(false);
    }
  }, [selectedStations]);

  // Toggle panel expansion
  const togglePanel = () => {
    setExpanded(prev => !prev);
  };

  // Only render if there are selected stations
  if (selectedStations.length === 0) {
    return null;
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: expanded ? 'auto' : '50px',
        height: 'auto',
        maxHeight: expanded ? 'calc(100vh - 220px)' : '120px', 
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 500,
        pointerEvents: 'auto',
        borderRadius: '20px',
        transition: 'width 0.2s ease-in-out, max-height 0.2s ease-in-out',
      }}
    >
      {/* Toggle button */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '50px',
        bgcolor: 'primary.main',
        color: 'white',
        cursor: 'pointer',
        borderRadius: '20px 0 0 20px',
      }}
      onClick={togglePanel}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            transform: 'rotate(-90deg)', 
            whiteSpace: 'nowrap',
            marginBottom: '2rem',
            fontWeight: 'bold',
            color: 'white',
            display: expanded ? 'none' : 'block'
          }}
        >
          Selected
        </Typography>
        <IconButton 
          size="small"
          sx={{ 
            color: 'white',
            padding: 0,
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)',
            }
          }}
        >
          {/* Replace KeyboardArrow icons with simple text/HTML arrow */}
          <span style={{ 
            fontSize: '1.4rem', 
            fontWeight: 'bold',
            transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
            display: 'inline-block',
            transition: 'transform 0.2s ease-in-out'
          }}>
            {expanded ? '→' : '←'}
          </span>
        </IconButton>
      </Box>
      
      {/* Content area */}
      {expanded && (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: selectedStations.length === 1 ? '245px' : '480px',
          transition: 'width 0.2s ease-in-out',
        }}>
          {/* Header with station count */}
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}>
            <Typography variant="h6" component="h2">
              Selected Stations ({selectedStations.length})
            </Typography>
            <IconButton 
              size="small"
              onClick={() => removeStation(null)} // Clear all selected stations
              sx={{ 
                color: 'error.main',
                p: 0.5,
              }}
            >
              {/* Replace CloseIcon with simple X */}
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                lineHeight: 1
              }}>
                ×
              </span>
            </IconButton>
          </Box>
          
          {/* Stations list with scroll */}
          <Box sx={{ 
            overflowY: 'auto',
            p: 1,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            maxHeight: 'calc(100vh - 290px)',
          }}>
            {selectedStations.map((station, index) => (
              <StationCard 
                key={station.id || index}
                station={station}
                onRemove={removeStation}
                selectedDate={selectedDate}
                forceExpanded={selectedStations.length <= 2} // Auto-expand if 1-2 stations selected
                formatTemperature={formatTemperature}
                formatRainfall={formatRainfall}
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default SelectedStationsBox;