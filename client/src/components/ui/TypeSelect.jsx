import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function TypeSelect( { type, setType } ) {

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel id="type-select-label">Type</InputLabel>
        <Select
          id="type-select"
          value={type}
          label="Type"
          onChange={(event) => setType(event.target.value)}
        >
          <MenuItem value={'temperature'}>Temperature</MenuItem>
          <MenuItem value={'rainfall'}>Rainfall</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}