import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import RainfallLineGraph from './rainfallLineGraph';

/**
 * GraphDisplay Component
 * Displays the data visualization graph
 * 
 * @param {Object} props - Component props
 * @param {Object} props.stationData - Data for all stations to display
 * @param {String} props.selectedType - Currently selected weather type
 * @param {Boolean} props.loading - Whether data is currently loading
 * @param {String|null} props.error - Error message if there was an error loading data
 * @param {String} props.frequency - Data frequency (daily, monthly, yearly)
 */
const GraphDisplay = ({ 
  stationData,
  selectedType,
  loading,
  error,
  frequency = 'daily'
}) => {
  // Determine if we have data to display
  const hasData = stationData && Object.keys(stationData).length > 0;

  return (
    <Card sx={{ 
      mb: 3,
      bgcolor: 'var(--card-bg, #ffffff)',
      borderRadius: '12px',
      boxShadow: 'var(--card-shadow, 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1))',
    }}>
      <CardContent>
        <Box sx={{ position: 'relative', minHeight: '400px' }}>
          {loading && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 10
            }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!hasData && !loading && !error && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '400px',
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              borderRadius: '8px'
            }}>
              <Typography color="text.secondary">
                Select date range to display data
              </Typography>
            </Box>
          )}

          <RainfallLineGraph 
            stationData={stationData}
            selectedType={selectedType}
            loading={loading} 
            error={error}
            height={400}
            frequency={frequency}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default GraphDisplay; 