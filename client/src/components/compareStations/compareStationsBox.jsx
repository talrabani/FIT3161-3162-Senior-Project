import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  TextField,
  Stack,
  Button,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useMapContext } from '../../context/MapContext';
import { format } from 'date-fns';
import { fetchStationWeatherRange } from '../../services/weatherApi';
import RainfallLineGraph from './rainfallLineGraph';
import * as d3 from "d3";
/**
 * CompareStationsBox Component
 * Displays the comparison chart interface with date selectors and a D3.js line graph
 * 
 * @param {Array} stationsToCompare - The stations being compared
 */
const CompareStationsBox = ({ stationsToCompare }) => {
  const { dateRange, setDateRange } = useMapContext();
  const { selectedDate } = useMapContext();
  const [startDate, setStartDate] = useState(dateRange.startDate || selectedDate);
  const [endDate, setEndDate] = useState(dateRange.endDate || new Date());
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState({});
  const [error, setError] = useState(null);

  // Handle date changes
  const handleStartDateChange = (newDate) => {
    setStartDate(newDate);
    setDateRange(prev => ({ ...prev, startDate: newDate }));
  };

  const handleEndDateChange = (newDate) => {
    setEndDate(newDate);
    setDateRange(prev => ({ ...prev, endDate: newDate }));
  };

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
      if (!stationsToCompare || stationsToCompare.length < 2 || !startDate || !endDate) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching comparison data for:');
        console.log('Stations:', stationsToCompare.map(s => s.name).join(', '));
        console.log('Date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
        
        // Dictionary to store station data
        const stationData = {};

        // Fetch data for each station
        for (const station of stationsToCompare) {
          const data = await fetchStationWeatherRange(station.id, startDate, endDate);
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
  }, [stationsToCompare, startDate, endDate]);

  const svgToXML = (svg) => {
    var serializer = new XMLSerializer();
    var xmlString = serializer.serializeToString(svg);
    return 'data:image/svg+xml;base64,' + btoa(xmlString);
  }
  const makeCanvas = (svg) => {
    const img = new Image;
    img.setAttribute('src', svgToXML(svg));
    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', svg.clientWidth);
    canvas.setAttribute('height', svg.clientHeight);
    canvas.getContext('2d').drawImage(img, 0, 0);
    return canvas;
  }
  // Make download button for the user
  const downloadGraph = (fileExtension) => {
    if (!d3.select('#chart').node()) return;
    const svg = d3.select('#chart').node();
    if (fileExtension != 'svg') {
      const canvas = makeCanvas(svg);
      var url = canvas.toDataURL(`image/${fileExtension}`, 1.0);
    } else {
      var url = svgToXML(svg);
    }
    const a = document.createElement('a');
    a.setAttribute('download', `download.${fileExtension}`);
    a.setAttribute('href', url);
    a.dispatchEvent(new MouseEvent('click'));
  }
  const downloadGraphAsPNG = () => {
    downloadGraph('png');
  }
  const downloadGraphAsJPEG = () => {
    downloadGraph('jpeg');
  }
  const downloadGraphAsSVG = () => {
    downloadGraph('svg');
  }
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
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                renderInput={(params) => <TextField size="small" {...params} />}
                disableFuture
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { width: '150px' }
                  }
                }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                renderInput={(params) => <TextField size="small" {...params} />}
                disableFuture
                minDate={startDate}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { width: '150px' }
                  }
                }}
              />
            </Stack>
          </LocalizationProvider>
        </Box>
        <Stack direction="column" spacing={2}>
            {/* Rainfall Line Graph */}
            <RainfallLineGraph 
              stationData={comparisonData}
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
        {/* Station list summary */}
        {/* <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Comparing {stationsToCompare?.length || 0} stations
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stationsToCompare?.map(station => station.name).join(', ')}
          </Typography>
        </Box> */}
      </CardContent>
    </Card>
  );
};

export default CompareStationsBox;
