import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Container,
  Paper,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import Navbar from '../components/ui/Navbar';
import CompareStationsBox from '../components/compareStations/compareStationsBox';
import SelectedStationsPanel from '../components/compareStations/SelectedStationsPanel';
import { useMapContext } from '../context/MapContext';

/**
 * Station Comparison Page
 * Displays the comparison interface on a dedicated page
 */
const StationComparisonPage = () => {
  const navigate = useNavigate();
  // Use the shared MapContext for selected stations state
  const { 
    selectedStations: stationsToCompare, 
    removeStation,
    setSelectedStations 
  } = useMapContext();
  
  const [loadError, setLoadError] = useState(null);
  
  // Check if we have enough stations to compare
  const hasEnoughStations = stationsToCompare && stationsToCompare.length >= 2;

  // Handle back button click - navigate back to map while preserving selected stations
  const handleBackClick = () => {
    // Simply navigate back, the stations will remain in the shared context
    navigate('/');
  };
  
  // Handle station removal using the context
  const handleRemoveStation = (stationToRemove) => {
    // Call the removeStation function from context
    removeStation(stationToRemove.name);
  };

  return (
    <div className="app-container d-flex flex-column min-vh-100">
      <Navbar />
      
      <Container maxWidth="xl" className="py-4 flex-grow-1">
        {loadError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
        )}
        
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
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Button 
              onClick={handleBackClick}
              variant="outlined"
              sx={{
                borderColor: '#d0d7f7',
                color: '#3949ab',
                '&:hover': {
                  backgroundColor: 'rgba(57, 73, 171, 0.04)',
                  borderColor: '#3949ab'
                }
              }}
            >
              ← Back to Map
            </Button>
            <Typography variant="h5" fontWeight="bold" color="#333">
              Weather Station Comparison
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" mb={4}>
            Compare weather data across multiple stations over time
          </Typography>
        </Paper>
        
        {/* Station Selection Panel */}
        <SelectedStationsPanel 
          stations={stationsToCompare} 
          onRemoveStation={handleRemoveStation} 
        />
          
        {!hasEnoughStations ? (
          <Paper
            elevation={0}
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              bgcolor: 'var(--card-bg, #ffffff)',
              borderRadius: '0.5rem',
              boxShadow: 'var(--card-shadow, 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1))'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Not enough stations selected for comparison
            </Typography>
            <Typography variant="body1" mb={3}>
              Please select at least 2 weather stations on the map to compare their data.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleBackClick}
              sx={{
                backgroundColor: '#3949ab',
                '&:hover': {
                  backgroundColor: '#1a237e'
                }
              }}
            >
              Go to Map
            </Button>
          </Paper>
        ) : (
          <CompareStationsBox stationsToCompare={stationsToCompare} />
        )}
      </Container>
      
      <footer className="text-center text-muted py-3 border-top">
        <Typography variant="body2">
          Data provided by the Australian Bureau of Meteorology. Explore weather stations across Australia.
        </Typography>
        <Typography variant="caption">
          © {new Date().getFullYear()} Australian Weather Explorer
        </Typography>
      </footer>
    </div>
  );
};

export default StationComparisonPage; 