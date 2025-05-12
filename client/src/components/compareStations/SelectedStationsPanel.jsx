import React from 'react';
import { 
  Box,
  Typography,
  Paper,
  Grid,
  Divider
} from '@mui/material';
import SelectedStation from './SelectedStation';
import { getStationColor } from './utils/colorUtils';

/**
 * SelectedStationsPanel Component
 * Displays a panel with all selected stations at the top of the comparison page
 * 
 * @param {Array} stations - The array of stations to display
 * @param {Function} onRemoveStation - Callback function when a station is removed
 */
const SelectedStationsPanel = ({ stations, onRemoveStation }) => {
  const handleRemoveStation = (station) => {
    if (onRemoveStation) {
      onRemoveStation(station);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        backgroundColor: 'var(--card-bg, #ffffff)',
        boxShadow: 'var(--card-shadow, 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1))',
        borderRadius: '0.5rem'
      }}
    >
      <Box mb={2}>
        <Typography variant="h6" fontWeight="bold" color="#333">
          Selected Weather Stations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {stations.length} station{stations.length !== 1 ? 's' : ''} selected for comparison
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {stations.length === 0 ? (
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No stations selected. Please return to the map and select stations to compare.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {stations.map(station => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={station.id || station.name}>
              <SelectedStation
                station={station}
                color={getStationColor(station.id)}
                onRemove={handleRemoveStation}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

export default SelectedStationsPanel; 