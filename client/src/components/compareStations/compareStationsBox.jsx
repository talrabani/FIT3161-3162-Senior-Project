import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  TextField,
  Stack,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useMapContext } from '../../context/MapContext';
import { format } from 'date-fns';
import { fetchStationRainfall, fetchStationTemperature } from '../../services/weatherApi';

/**
 * CompareStationsBox Component
 * Displays the comparison chart interface with date selectors and a placeholder for graphs
 * 
 * @param {Array} stationsToCompare - The stations being compared
 */
const CompareStationsBox = ({ stationsToCompare }) => {
  const { dateRange, setDateRange } = useMapContext();
  const [startDate, setStartDate] = useState(dateRange.startDate || new Date(2000, 0, 1));
  const [endDate, setEndDate] = useState(dateRange.endDate || new Date());
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState([]);
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

  // Fetch data for comparison when stations or date range changes
  useEffect(() => {
    const fetchComparisonData = async () => {
      if (!stationsToCompare || stationsToCompare.length < 2 || !startDate || !endDate) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // This is a placeholder for actual data fetching logic
        // In a real implementation, we would fetch data for the entire date range
        // and create a time series for each station
        
        // For now, we'll just log the request
        console.log('Fetching comparison data for:');
        console.log('Stations:', stationsToCompare.map(s => s.name).join(', '));
        console.log('Date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
        
        // Simulate fetching data
        const mockData = stationsToCompare.map(station => ({
          stationId: station.id,
          stationName: station.name,
          data: [
            // This would be time series data in a real implementation
            { date: startDate, rainfall: Math.random() * 30, temperature: 15 + Math.random() * 10 }
          ]
        }));
        
        // Wait a bit to simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setComparisonData(mockData);
      } catch (err) {
        console.error('Error fetching comparison data:', err);
        setError('Failed to fetch comparison data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComparisonData();
  }, [stationsToCompare, startDate, endDate]);

  return (
    <Card sx={{ 
      p: 1, 
      bgcolor: '#f9f9f9',
      borderRadius: '12px',
      mt: 2
    }}>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
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
        
        {/* Graph Placeholder */}
        <Box
          sx={{
            width: '100%',
            height: '300px',
            bgcolor: '#eaeaea',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px dashed #ccc'
          }}
        >
          {loading ? (
            <CircularProgress size={40} />
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Typography color="text.secondary">
              Graph will be implemented here
            </Typography>
          )}
        </Box>

        {/* Station list summary */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Comparing {stationsToCompare?.length || 0} stations
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stationsToCompare?.map(station => station.name).join(', ')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CompareStationsBox;
