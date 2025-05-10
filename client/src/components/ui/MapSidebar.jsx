import { Box, TextField, Button, Typography } from '@mui/material'
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
    setSelectedType
  } = useMapContext();
  
  // Local state for form fields that might not need to be shared globally
  const [formData, setFormData] = useState({
    frequency: 'yearly'
  })

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
      
      {/* Calendar input */}
      <Box sx={{ 
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px'
      }}>
        <Box sx={{ fontSize: '20px', fontWeight: 'bold', mb: 2 }}>Calender input</Box>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <StaticDatePicker
            orientation="landscape"
            value={selectedDate}
            onChange={handleDateChange}
          />
        </LocalizationProvider>
      </Box>
      
      <FrequencyRadioGroup 
        frequency={formData.frequency} 
        setFrequency={(newFrequency) => updateFormData('frequency', newFrequency)}
      />
    </Box>
  )
}
