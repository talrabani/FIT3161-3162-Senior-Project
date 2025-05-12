import { Box, TextField, Button, Typography, Tooltip } from '@mui/material'
import { useState, useEffect } from 'react'
import { DatePicker, StaticDatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useMapContext } from '../../context/MapContext'

import FrequencyRadioGroup from './FrequencyRadioGroup.jsx'
import StationSearch from './StationSearch.jsx'
import TypeSelect from './TypeSelect.jsx'

export default function MapSidebar() {
  const { 
    selectedDate, 
    setSelectedDate, 
    selectedSA4, 
    setSelectedSA4,
    selectedType,
    setSelectedType,
    timeFrequency,
    setFrequency,
  } = useMapContext();
  
  // Local state for form fields that might not need to be shared globally
  const [formData, setFormData] = useState({
    frequency: 'yearly'
  })
  const handleFrequencyChange = (value) => {
    var newDate;
    switch (value) {
      case 'monthly': {
        setFrequency(['year','month']);
        newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        break;}
      case 'yearly': {
        setFrequency(['year']);
        newDate = new Date(selectedDate.getFullYear(), 0, 1)
        break;}
      }
    handleDateChange(newDate);
    updateFormData('frequency', value);
  }
  // Generic update function that handles local form fields
  const updateFormData = (field, value) => {
    const updatedFormData = {
      ...formData,
      [field]: value
    }
    
    // Update local state
    setFormData(updatedFormData)
    
    // Log changes
    console.log('Form data updated:', updatedFormData)
  }
  
  // Handle date change - this updates the context
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    console.log('Selected date updated:', newDate);
  }
  
  // Handle when a station is selected - we may need to update SA4 context
  const handleStationSelect = (station) => {
    console.log('Station selected in MapSidebar:', station);
    
    // If the station has location data that contains SA4 info, we could update context
    // This would typically come from the backend, but for now we just log it
    if (station.original && station.original.sa4_code) {
      setSelectedSA4(station.original.sa4_code);
    }
  };

  // Handle type change - this updates the context
  const handleTypeChange = (newType) => {
    setSelectedType(newType);
    console.log('Selected type updated:', newType);
  }

  // Set initial frequency based on the form data
  useEffect(() => {
    handleFrequencyChange(formData.frequency);
  }, []);

  // Max date available for yearly view
  const maxYearlyDate = new Date(2024, 11, 31);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px', 
      padding: '20px',
    }}>
      {/* Replace LocationInput with StationSearch */}
      <Box>
        <StationSearch onStationSelect={handleStationSelect} />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Search for stations by name, ID, or location
        </Typography>
      </Box>
      
      {/* Weather type selector */}
      <TypeSelect 
        type={selectedType} 
        setType={handleTypeChange} 
      />

      <FrequencyRadioGroup 
        frequency={formData.frequency} 
        setFrequency={(newFrequency) => handleFrequencyChange(newFrequency)}
      />
      
      {/* Calendar input */}
      <Box sx={{ 
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px'
      }}>
        <Box sx={{ fontSize: '20px', fontWeight: 'bold', mb: 2 }}>
          Calendar input
        </Box>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <StaticDatePicker
            views={timeFrequency}
            openTo={formData.frequency === 'yearly' ? 'year' : 'month'}
            orientation="landscape"
            value={selectedDate}
            onChange={handleDateChange}
            displayStaticWrapperAs="desktop"
            maxDate={maxYearlyDate}
            minDate={new Date(1990, 0, 1)} // Start from 1990
            // Set the default view to show recent years/months first
            defaultCalendarMonth={new Date(2023, 0, 1)}
          />
        </LocalizationProvider>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Note: Data may be unavailable for some stations/time periods
        </Typography>
      </Box>
      
      
    </Box>
  )
}
