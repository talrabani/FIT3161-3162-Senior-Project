import  { Box, TextField, Button } from '@mui/material'
import { useState } from 'react'

import FrequencyRadioGroup from './FrequencyRadioGroup.jsx'
import LocationInput from './LocationInput.jsx'
import TypeSelect from './TypeSelect.jsx'

export default function MapSidebar() {
  const [location, setLocation] = useState('')
  const [type, setType] = useState('temperature')
  const [startDate, setStartDate] = useState('2024-01-01')
  const [endDate, setEndDate] = useState('2025-01-01')
  const [frequency, setFrequency] = useState('yearly')

   
  const handleVisualise = () => {
    const visualisationData = {
      location,
      type,
      startDate,
      endDate,
      frequency
    }

    console.log(visualisationData)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px'}}>
      <LocationInput location={location} setLocation={setLocation} />
      <TypeSelect type={type} setType={setType} />
      <Box sx={{display: 'flex', flexDirection: 'row', gap: "20px"}}>
        <TextField 
          sx={{ width: "100%" }} 
          label="Start Date" 
          id="start_date" 
          onChange={(event) => setStartDate(event.target.value)}
        />
        <TextField 
          sx={{ width: "100%" }} 
          label="End Date" 
          id="end_date" 
          onChange={(event) => setEndDate(event.target.value)}
        />
      </Box>
      <FrequencyRadioGroup frequency={frequency} setFrequency={setFrequency}/>
      <Button 
        variant="container" 
        sx={{ background: 'pink' }}
        onClick={handleVisualise}
      >
        Visualise
      </Button>
    </Box>
  )
}
