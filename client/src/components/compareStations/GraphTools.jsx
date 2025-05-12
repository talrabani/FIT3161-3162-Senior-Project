import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Stack 
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import TypeSelect from '../ui/TypeSelect';

/**
 * GraphTools Component
 * Contains controls for adjusting graph settings: weather type and date range
 * 
 * @param {Object} props - Component props
 * @param {String} props.selectedType - Currently selected weather type
 * @param {Function} props.onTypeChange - Handler for type changes
 * @param {Object} props.dateRange - Current date range {startDate, endDate}
 * @param {Function} props.onStartDateChange - Handler for start date changes
 * @param {Function} props.onEndDateChange - Handler for end date changes
 */
const GraphTools = ({ 
  selectedType,
  onTypeChange,
  dateRange,
  onStartDateChange,
  onEndDateChange
}) => {
  return (
    <Card sx={{ 
      mb: 3,
      bgcolor: 'var(--card-bg, #ffffff)',
      borderRadius: '12px',
      boxShadow: 'var(--card-shadow, 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1))',
    }}>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 }
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
            Graph Settings
          </Typography>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2}
            width={{ xs: '100%', md: 'auto' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TypeSelect 
              type={selectedType} 
              setType={onTypeChange} 
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={1}
                width={{ xs: '100%', sm: 'auto' }}
              >
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={onStartDateChange}
                  disableFuture
                  slotProps={{
                    textField: {
                      variant: 'outlined',
                      size: "small",
                      sx: { width: { xs: '100%', sm: '150px' } }
                    }
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={onEndDateChange}
                  disableFuture
                  minDate={dateRange.startDate}
                  slotProps={{
                    textField: {
                      variant: 'outlined',
                      size: "small", 
                      sx: { width: { xs: '100%', sm: '150px' } }
                    }
                  }}
                />
              </Stack>
            </LocalizationProvider>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GraphTools; 