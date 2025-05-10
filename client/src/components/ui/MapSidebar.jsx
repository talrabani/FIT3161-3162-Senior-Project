import { Box, TextField, Button } from '@mui/material'
import { useState, useEffect } from 'react'
import { DatePicker, StaticDatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useMapContext } from '../../context/MapContext'

import FrequencyRadioGroup from './FrequencyRadioGroup.jsx'
import LocationInput from './LocationInput.jsx'
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
    location: '',
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
  
  // Handle location change - this might update the SA4 code in context
  const handleLocationChange = (newLocation) => {
    updateFormData('location', newLocation);
    
    // If the location has an SA4 code, update the context
    if (newLocation && newLocation.sa4Code) {
      setSelectedSA4(newLocation.sa4Code);
    }
  }

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
      {/* Search bar at the top */}
      <LocationInput 
        location={formData.location} 
        setLocation={handleLocationChange} 
      />
      
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
