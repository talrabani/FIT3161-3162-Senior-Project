import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material'

export default function FrequenceyRadioGroup( { frequency, setFrequency } ) {
  return (
    <FormControl>
      <FormLabel id="frequency-radio-group-form">Frequency</FormLabel>
      <RadioGroup
        defaultValue="yearly"
        name="frequency-radio-group"
        sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}
        value={frequency}
        onChange={(event) => setFrequency(event.target.value)}
      >
        <FormControlLabel value="monthly" control={<Radio />} label="Monthly" />
        <FormControlLabel value="yearly" control={<Radio />} label="Yearly" />
      </RadioGroup>
    </FormControl>
  )
}
