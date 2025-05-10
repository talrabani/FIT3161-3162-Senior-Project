import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Stack,
  Button,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import TypeSelect from '../ui/TypeSelect'
import { useMapContext } from '../../context/MapContext';
import { format } from 'date-fns';
import { fetchStationWeatherRange } from '../../services/weatherApi';
import RainfallLineGraph from './rainfallLineGraph';
import { downloadGraphAsPNG, downloadGraphAsJPEG, downloadGraphAsSVG } from '../utils/downloadChart';

/**
 * CompareStationsBox Component
 * Displays the comparison chart interface with date selectors and a D3.js line graph
 * 
 * @param {Array} stationsToCompare - The stations being compared
 */
const CompareStationsBox = ({ stationsToCompare }) => {
  const { selectedDate, dateRange, setDateRange, selectedType } = useMapContext();
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState({});
  const [error, setError] = useState(null);
  
  // Set the graph type, which is separate to one on the map
  const [selectedGraphType, setSelectedType] = useState(selectedType.valueOf());
  
  // Handle changes in the date range - this updates the context
  const handleStartDateChange = (newDate) => {
    setDateRange(prev => ({ ...prev, startDate: newDate }));
    console.log('Start Date updated:', newDate);
    };

  const handleEndDateChange = (newDate) => {
    setDateRange(prev => ({ ...prev, endDate: newDate }));
    console.log('End Date updated:', newDate);
    };
  
  // Handle type change - this updates the context
  const handleTypeChange = (newType) => {
    setSelectedType(newType);
    console.log('Selected type updated:', newType);
  }

  // Generate a consistent color for each station ID
  const getStationColor = (stationId) => {
    // Predefined color palette with distinct colors
    const colorPalette = [
      '#1f77b4', // blue
      '#ff7f0e', // orange
      '#2ca02c', // green
      '#d62728', // red
      '#9467bd', // purple
      '#8c564b', // brown
      '#e377c2', // pink
      '#7f7f7f', // gray
      '#bcbd22', // olive
      '#17becf', // teal
      '#aec7e8', // light blue
      '#ffbb78', // light orange
      '#98df8a', // light green
      '#ff9896', // light red
      '#c5b0d5'  // light purple
    ];
    
    // Use the station ID to pick a consistent color from the palette
    const hash = stationId.toString().split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // Use modulo to get an index within the palette range
    const colorIndex = hash % colorPalette.length;
    
    return colorPalette[colorIndex];
  };

  // Fetch data for comparison when stations or date range changes
  useEffect(() => {
    const fetchComparisonData = async () => {
      setDateRange({
        startDate: (!dateRange.startDate)? selectedDate : dateRange.startDate,
        endDate: (!dateRange.endDate)? new Date(new Date(selectedDate).setDate(selectedDate.getDate()+4)) : dateRange.endDate
      })
      if (!stationsToCompare || stationsToCompare.length < 2) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching comparison data for:');
        console.log('Stations:', stationsToCompare.map(s => s.name).join(', '));
        console.log('Date range:', format(dateRange.startDate, 'yyyy-MM-dd'), 'to', format(dateRange.endDate, 'yyyy-MM-dd'));
        
        // Dictionary to store station data
        const stationData = {};

        // Fetch data for each station
        for (const station of stationsToCompare) {
          const data = await fetchStationWeatherRange(station.id, dateRange.startDate, dateRange.endDate);
          stationData[station.id] = {
            id: station.id,
            name: station.name,
            color: getStationColor(station.id),
            data: data
          };
        }

        // Set the fetched data
        setComparisonData(stationData);
      } catch (err) {
        console.error('Error fetching comparison data:', err);
        setError('Failed to fetch comparison data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComparisonData();
  }, [stationsToCompare, dateRange.startDate, dateRange.endDate, selectedGraphType]);

  return (
    <Card sx={{ 
      p: 1, 
      bgcolor: '#f9f9f9',
      borderRadius: '12px',
      mt: 2,
    }}>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
            Station Comparison
          </Typography>
          
          <Stack direction="row" spacing={2}>
            <TypeSelect 
              type={selectedGraphType} 
              setType={handleTypeChange} 
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={dateRange.startDate}
                onChange={handleStartDateChange}
                disableFuture
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    size: "small",
                    sx: { width: '150px' }
                  }
                }}
              />
              <DatePicker
                label="End Date"
                value={dateRange.endDate}
                onChange={handleEndDateChange}
                disableFuture
                minDate={dateRange.startDate}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    size: "small",
                    sx: { width: '150px' }
                  }
                }}
              />
            </LocalizationProvider>
          </Stack>
        </Box>
        <Stack direction="column" spacing={2}>
            {/* Rainfall Line Graph */}
            <RainfallLineGraph 
              stationData={comparisonData}
              selectedType={selectedGraphType}
              loading={loading}
              error={error}
              height={300}
            />
          
          {/* Download buttons for the user */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained" 
              color="primary"
              size="small"
              disabled={(!comparisonData || Object.keys(comparisonData).length === 0)}
              sx={{ fontSize: '0.8rem' }}
              onClick={downloadGraphAsSVG}
              >
              Download Graph as SVG
            </Button>
            <Button
              variant="contained" 
              color="primary"
              size="small"
              disabled={(!comparisonData || Object.keys(comparisonData).length === 0)}
              sx={{ fontSize: '0.8rem' }}
              onClick={downloadGraphAsPNG}
              >
              Download Graph as PNG
            </Button>
            <Button
              variant="contained" 
              color="primary"
              size="small"
              disabled={(!comparisonData || Object.keys(comparisonData).length === 0)}
              sx={{ fontSize: '0.8rem' }}
              onClick={downloadGraphAsJPEG}
              >
              Download Graph as JPEG
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CompareStationsBox;
