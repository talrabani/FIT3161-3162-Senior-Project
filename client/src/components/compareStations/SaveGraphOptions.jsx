import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Stack,
  Button
} from '@mui/material';
import { downloadGraphAsPNG, downloadGraphAsJPEG, downloadGraphAsSVG, downloadAsCSV, downloadTemperatureRangeAsCSV } from '../utils/downloadChart';

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
  // Handle CSV download based on graph type
  const handleCsvDownload = () => {
    if (graphType === 'temp_range') {
      downloadTemperatureRangeAsCSV(comparisonData, frequency);
    } else {
      downloadAsCSV(comparisonData, graphType, frequency);
    }
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
          Download the graph in your preferred format
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
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SaveGraphOptions; 