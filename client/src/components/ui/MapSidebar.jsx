import { Box, TextField, Button } from '@mui/material'
import { useState, useEffect } from 'react'
import { DatePicker, StaticDatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

import FrequencyRadioGroup from './FrequencyRadioGroup.jsx'
import LocationInput from './LocationInput.jsx'
import TypeSelect from './TypeSelect.jsx'

export default function MapSidebar({ onFormDataChange = () => {} }) {
  // Single state object for all form data
  const [formData, setFormData] = useState({
    location: '',
    type: 'temperature',
    selectedDate: new Date(),
    frequency: 'yearly'
  })

  const handleVisualise = () => {
    console.log('visualisationData:', formData)
    
    // Call the onFormDataChange prop with the entire form data
    onFormDataChange(formData)
  }

  // Call handleVisualise on initial load
  useEffect(() => {
    handleVisualise()
  }, []) // Empty dependency array means this runs once on mount

  // Generic update function that handles all form fields
  const updateFormData = (field, value) => {
    const updatedFormData = {
      ...formData,
      [field]: value
    }
    
    // Update state
    setFormData(updatedFormData)
    
    // Log and notify parent component with the complete updated form data
    console.log('visualisationData:', updatedFormData)
    onFormDataChange(updatedFormData)
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
        setLocation={(newLocation) => updateFormData('location', newLocation)} 
      />
      
      {/* Type selector below the search bar */}
      <TypeSelect 
        type={formData.type} 
        setType={(newType) => updateFormData('type', newType)} 
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
            value={formData.selectedDate}
            onChange={(newDate) => updateFormData('selectedDate', newDate)}
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
