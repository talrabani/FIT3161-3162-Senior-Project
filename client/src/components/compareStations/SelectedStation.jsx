import React from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper 
} from '@mui/material';

/**
 * SelectedStation Component
 * Displays an individual station with its assigned color in the comparison tool
 * 
 * @param {Object} station - The station data to display
 * @param {String} color - The color assigned to this station for the graph
 * @param {Function} onRemove - Callback function to remove the station
 */
const SelectedStation = ({ station, color, onRemove }) => {
  // Handle remove button click
  const handleRemoveClick = () => {
    if (onRemove) {
      onRemove(station);
    }
  };

  // Format years of operation text
  const getYearsText = () => {
    const startYear = station.start_year || station.startYear;
    const endYear = station.end_year || station.endYear;
    
    if (startYear && endYear) {
      return `${startYear} - ${endYear === "2023" ? "Present" : endYear}`;
    } else if (startYear) {
      return `Since ${startYear}`;
    } else if (endYear) {
      return `Until ${endYear}`;
    }
    return null;
  };

  const yearsText = getYearsText();

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1.5,
        borderRadius: '8px',
        borderLeft: `4px solid ${color}`,
        backgroundColor: 'var(--card-bg, #ffffff)',
        boxShadow: 'var(--card-shadow, 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1))',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.12)',
        }
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#333' }}>
          {station.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          ID: {station.id} {station.elevation && `• Elevation: ${station.elevation}m`}
        </Typography>
        {station.state && (
          <Typography variant="caption" color="text.secondary" component="div">
            State: {station.state}
          </Typography>
        )}
        {yearsText && (
          <Typography variant="caption" color="text.secondary" component="div" 
            sx={{ 
              mt: 0.5, 
              fontWeight: 'medium',
              backgroundColor: 'rgba(57, 73, 171, 0.08)',
              px: 1, 
              py: 0.25,
              borderRadius: '4px',
              display: 'inline-block'
            }}
          >
            {yearsText}
          </Typography>
        )}
      </Box>
      <IconButton 
        size="small" 
        onClick={handleRemoveClick}
        sx={{ 
          color: '#aaa',
          '&:hover': { 
            color: '#d32f2f',
            backgroundColor: 'rgba(211, 47, 47, 0.04)'
          } 
        }}
      >
        ✕
      </IconButton>
    </Paper>
  );
};

export default SelectedStation; 