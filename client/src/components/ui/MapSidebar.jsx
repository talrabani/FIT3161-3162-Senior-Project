import { Box, TextField, Button } from '@mui/material'
import { useState, useEffect } from 'react'
import { DatePicker, StaticDatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

import FrequencyRadioGroup from './FrequencyRadioGroup.jsx'
import LocationInput from './LocationInput.jsx'
import TypeSelect from './TypeSelect.jsx'

export default function MapSidebar() {
  const [location, setLocation] = useState('')
  const [type, setType] = useState('temperature')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [frequency, setFrequency] = useState('yearly')

   
  const handleVisualise = () => {
    const visualisationData = {
      location,
      type,
      selectedDate,
      frequency
    }

    console.log(`visualisationData: ${visualisationData}`)
  }

  // Call handleVisualise on initial load
  useEffect(() => {
    handleVisualise()
  }, []) // Empty dependency array means this runs once on mount

  // Create wrapped setter functions that update state and call handleVisualise
  const handleLocationChange = (newLocation) => {
    setLocation(newLocation)
    handleVisualise()
  }

  const handleTypeChange = (newType) => {
    setType(newType)
    handleVisualise()
  }

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate)
    handleVisualise()
  }

  const handleFrequencyChange = (newFrequency) => {
    setFrequency(newFrequency)
    handleVisualise()
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px', 
      padding: '20px',
    }}>
      {/* Search bar at the top */}
      <LocationInput location={location} setLocation={handleLocationChange} />
      
      
      {/* Type selector below the search bar */}
      <TypeSelect type={type} setType={handleTypeChange} />

      
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
      
      <FrequencyRadioGroup frequency={frequency} setFrequency={handleFrequencyChange}/>
    </Box>
  )
}
