import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function TypeSelect( { type, setType } ) {

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel id="type-select-label">Weather Type</InputLabel>
        <Select
          id="type-select"
          value={type}
          label="Weather Type"
          onChange={(event) => setType(event.target.value)}
        >
          <MenuItem value={'rainfall'}>Rainfall</MenuItem>
          <MenuItem value={'max_temp'}>Maximum Temperature</MenuItem>
          <MenuItem value={'min_temp'}>Minimum Temperature</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}