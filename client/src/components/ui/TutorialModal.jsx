import React, { useState } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  Button, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';

// Default placeholder image
const PLACEHOLDER_IMAGE = '/tutorial/placeholder.svg';

// Custom emoji icons for steps
const ICONS = {
  INFO: '📚',     // Info/Welcome
  MAP: '🗺️',      // Map
  SETTINGS: '⚙️',  // Settings
  DATE: '📅',     // Time period
  LOCATION: '📍',  // Location/region
  COMPARE: '📋',   // Selected stations
  CHART: '📊'      // Comparison charts
};

/**
 * Tutorial modal component that guides users through the application features
 * 
 * @param {Object} props
 * @param {boolean} props.open Whether the modal is open
 * @param {Function} props.onClose Function to call when the modal is closed
 */
const TutorialModal = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [failedImages, setFailedImages] = useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Define tutorial steps
  const steps = [
    {
      label: 'Welcome to the Australian Weather Explorer',
      icon: ICONS.INFO,
      description: `
        This tutorial will guide you through the main features of the application.
        You can navigate through the tutorial using the buttons below or close it at any time.
      `,
      image: null
    },
    {
      label: 'Map and Station Selection',
      icon: ICONS.MAP,
      description: `
        The main map displays weather stations across Australia. You can:
        • Zoom in and out to explore different regions
        • Click on a region to highlight the stations within that area
        • Click on individual stations to select them for detailed analysis
        Pro tip: By holding down the shift key, you can highlight stations in a specific area.
      `,
      image: '/tutorial/mapSelect.png'
    },
    {
      label: 'Map Settings Panel',
      icon: ICONS.SETTINGS,
      description: `
        On the right panel, you can adjust various settings to customize the map display:
        • Toggle between different data types (rainfall, temperature)
        • Search for stations by name, ID, or location
      `,
      image: '/tutorial/mapSettings.png'
    },
    {
      label: 'Time Period Selection',
      icon: ICONS.DATE,
      description: `
        Adjust the frequency and date settings to display average data for different time periods:
        • Select daily, monthly, or yearly frequency
        • The map will update to show weather patterns for the selected time period
      `,
      image: '/tutorial/timePeriod.png'
    },
    {
      label: 'Selected Stations Panel',
      icon: ICONS.COMPARE,
      description: `
        The Selected Stations panel shows all stations you've chosen:
        • View summary information for each selected station
        • Click on a station card to expand and see detailed statistics
        • Remove stations you no longer want to analyze
        • With 2 or more stations selected, you can generate comparison graphs
      `,
      image: '/tutorial/selectedStations.png'
    },
    {
      label: 'Station Comparison - Graphing Tools',
      icon: ICONS.CHART,
      description: `
        Generate powerful visual comparisons between stations:
        • Compare rainfall, maximum temperature, minimum temperature, or a range of temperature data
        • View data across different time periods and frequencies
        • Identify patterns and anomalies between different geographical locations
        • Export graphs for research or presentations
      `,
      image: '/tutorial/stationComparison.png'
    }
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFailedImages({});
  };

  const handleClose = () => {
    onClose();
    // Reset step and failed images when closed
    setTimeout(() => {
      setActiveStep(0);
      setFailedImages({});
    }, 300);
  };

  const handleImageError = (index) => {
    setFailedImages(prev => ({
      ...prev,
      [index]: true
    }));
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="tutorial-modal-title"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMobile ? '95%' : '80%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        bgcolor: 'background.paper',
        borderRadius: '8px',
        boxShadow: 24,
        p: 4,
      }}>
        <Button 
          onClick={handleClose}
          sx={{ 
            position: 'absolute', 
            right: 8, 
            top: 8,
            minWidth: 'auto',
            p: 1
          }}
        >
          ✖️
        </Button>
        
        <Typography 
          id="tutorial-modal-title" 
          variant="h5" 
          component="h2" 
          sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main }}
        >
          Application Tutorial
        </Typography>
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel StepIconComponent={() => (
                <Box sx={{ 
                  color: index === activeStep 
                    ? theme.palette.primary.main 
                    : index < activeStep 
                      ? theme.palette.success.main 
                      : 'gray',
                  mr: 1,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '1.5rem'
                }}>
                  {step.icon}
                </Box>
              )}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography sx={{ whiteSpace: 'pre-line' }}>{step.description}</Typography>
                {step.image && (
                  <Box sx={{ 
                    my: 2, 
                    p: 1, 
                    border: '1px solid #eee', 
                    borderRadius: 1,
                    textAlign: 'center'
                  }}>
                    <img 
                      src={failedImages[index] ? PLACEHOLDER_IMAGE : step.image} 
                      alt={step.label} 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        objectFit: 'contain' 
                      }} 
                      onError={() => handleImageError(index)}
                    />
                    {failedImages[index] && (
                      <Typography 
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                          mt: 1
                        }}
                      >
                        Tutorial image not available yet
                      </Typography>
                    )}
                  </Box>
                )}
                <Box sx={{ mb: 2 }}>
                  <div>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      {index === steps.length - 1 ? 'Finish' : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        {activeStep === steps.length && (
          <Paper square elevation={0} sx={{ p: 3 }}>
            <Typography>Tutorial complete - you&apos;re now ready to explore the application!</Typography>
            <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
              Restart Tutorial
            </Button>
            <Button variant="contained" onClick={handleClose} sx={{ mt: 1, mr: 1 }}>
              Start Exploring
            </Button>
          </Paper>
        )}
      </Box>
    </Modal>
  );
};

export default TutorialModal; 