import React, { useState } from 'react';
import * as d3 from "d3";
import { 
  Card, 
  CardContent, 
  Typography, 
  Stack,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { downloadGraphAsPNG, downloadGraphAsJPEG, downloadGraphAsSVG, downloadAsCSV, downloadTemperatureRangeAsCSV } from '../utils/downloadChart';
import AuthService from '../../services/auth.service';

/**
 * SaveGraphOptions Component
 * Provides buttons to download the graph in different formats
 * 
 * @param {Object} props - Component props
 * @param {Boolean} props.hasData - Whether there is data to download
 * @param {Object} props.comparisonData - The data to be downloaded
 * @param {String} props.graphType - The type of graph (rainfall, max_temp, min_temp, temp_range)
 * @param {String} props.frequency - The data frequency (daily, monthly, yearly)
 */
const SaveGraphOptions = ({ hasData = false, comparisonData, graphType, frequency }) => {
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Handle CSV download based on graph type
  const handleCsvDownload = () => {
    if (graphType === 'temp_range') {
      downloadTemperatureRangeAsCSV(comparisonData, frequency);
    } else {
      downloadAsCSV(comparisonData, graphType, frequency);
    }
  };

  // Close notification
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  // Handle saving graph to localStorage
  const handleSaveGraph = () => {
    if (!hasData) return;

    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || !currentUser.user) {
      setNotification({
        open: true,
        message: "Please log in to save graphs",
        severity: "error"
      });
      return;
    }

    const svg = d3.select('#chart').node();
    if (!svg) {
      setNotification({
        open: true,
        message: "Error saving graph: Chart not found",
        severity: "error"
      });
      return;
    }

    // Get the SVG content
    const svgContent = svg.outerHTML;
    
    // Create a new saved graph object
    const savedGraph = {
      id: Date.now(), // Use timestamp as unique ID
      userId: currentUser.user.id, // Use the correct user ID structure
      svg: svgContent,
      type: graphType,
      frequency: frequency,
      date: new Date().toISOString(),
      stations: Object.keys(comparisonData).map(key => comparisonData[key].name)
    };

    // Get existing saved graphs from localStorage
    const savedGraphs = JSON.parse(localStorage.getItem('savedGraphs') || '[]');
    
    // Add new graph to the array
    savedGraphs.push(savedGraph);
    
    // Save back to localStorage
    localStorage.setItem('savedGraphs', JSON.stringify(savedGraphs));

    // Show success notification
    setNotification({
      open: true,
      message: "Graph saved successfully!",
      severity: "success"
    });
  };

  return (
    <Card sx={{ 
      mb: 3,
      bgcolor: 'var(--card-bg, #ffffff)',
      borderRadius: '12px',
      boxShadow: 'var(--card-shadow, 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1))',
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
          Save Graph
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Download the graph in your preferred format or save it for later viewing
        </Typography>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="center"
        >
          <Button
            variant="contained" 
            color="primary"
            size="small"
            disabled={!hasData}
            sx={{ 
              fontSize: '0.8rem',
              backgroundColor: '#3949ab',
              '&:hover': {
                backgroundColor: '#1a237e'
              }
            }}
            onClick={handleCsvDownload}
          >
            Download as CSV
          </Button>
          <Button
            variant="contained" 
            color="primary"
            size="small"
            disabled={!hasData}
            sx={{ 
              fontSize: '0.8rem',
              backgroundColor: '#3949ab',
              '&:hover': {
                backgroundColor: '#1a237e'
              }
            }}
            onClick={downloadGraphAsSVG}
          >
            Download as SVG
          </Button>
          <Button
            variant="contained" 
            color="primary"
            size="small"
            disabled={!hasData}
            sx={{ 
              fontSize: '0.8rem',
              backgroundColor: '#3949ab',
              '&:hover': {
                backgroundColor: '#1a237e'
              }
            }}
            onClick={downloadGraphAsPNG}
          >
            Download as PNG
          </Button>
          <Button
            variant="contained" 
            color="primary"
            size="small"
            disabled={!hasData}
            sx={{ 
              fontSize: '0.8rem',
              backgroundColor: '#3949ab',
              '&:hover': {
                backgroundColor: '#1a237e'
              }
            }}
            onClick={downloadGraphAsJPEG}
          >
            Download as JPEG
          </Button>
          <Button
            variant="contained" 
            color="success"
            size="small"
            disabled={!hasData}
            sx={{ 
              fontSize: '0.8rem',
              backgroundColor: '#2e7d32',
              '&:hover': {
                backgroundColor: '#1b5e20'
              }
            }}
            onClick={handleSaveGraph}
          >
            Save Graph
          </Button>
        </Stack>
      </CardContent>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default SaveGraphOptions; 