import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  CircularProgress, 
  Box, 
  Typography,
  Chip,
  InputAdornment,
  IconButton
} from '@mui/material';
import { searchWeatherStations } from '../../services/weatherApi';
import { useMapContext } from '../../context/MapContext';

/**
 * StationSearch Component
 * A search box for finding weather stations in the database
 * 
 * @param {Object} props
 * @param {Function} props.onStationSelect - Optional callback when a station is selected
 */
const StationSearch = ({ onStationSelect }) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Use the context for adding stations and managing selected map station
  const { 
    addStation, 
    setSelectedMapStation
  } = useMapContext();

  // Format station ID for display (add leading zeros if needed)
  const formatStationId = (id) => {
    if (id === undefined || id === null) return 'Unknown';
    return id.toString().padStart(6, '0');
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (!inputValue || inputValue.trim().length < 2) {
      setOptions([]);
      return;
    }

    let active = true;
    const searchTimeout = setTimeout(() => {
      setLoading(true);
      
      searchWeatherStations(inputValue)
        .then((results) => {
          if (active) {
            // Map the API response to the format expected by Autocomplete
            const mappedResults = results.map(station => ({
              id: station.station_id,
              name: station.station_name,
              state: station.station_state,
              elevation: station.station_height,
              startYear: station.station_start_year,
              endYear: station.station_end_year,
              latitude: station.location?.coordinates[1],
              longitude: station.location?.coordinates[0],
              // Keep the original data for reference
              original: station
            }));
            
            setOptions(mappedResults);
          }
        })
        .catch(err => {
          console.error('Error searching for stations:', err);
          setOptions([]);
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });
    }, 500); // 500ms debounce

    return () => {
      active = false;
      clearTimeout(searchTimeout);
    };
  }, [inputValue]);

  // Convert our station format to the format expected by MapStationSelectCard
  const convertToMapStationFormat = (station) => {
    if (!station) return null;
    
    return {
      station_id: station.id,
      station_name: station.name,
      station_state: station.state,
      station_height: station.elevation,
      station_start_year: station.startYear,
      station_end_year: station.endYear,
      location: station.original?.location || { 
        coordinates: [station.longitude || 0, station.latitude || 0] 
      }
    };
  };

  // Handle when a station is selected from the dropdown
  const handleStationSelect = (event, station) => {
    if (station) {
      console.log('Station selected:', station);
      
      // Convert the station to the format expected by the map
      const mapStation = convertToMapStationFormat(station);
      
      // Set the selected station in the context - this will make it appear on the map
      setSelectedMapStation(mapStation);
      
      // Add to selected stations context
      addStation(station);
      
      // Call the optional callback
      if (onStationSelect) {
        onStationSelect(station);
      }
      
      // Clear the input
      setInputValue('');
    }
  };

  // Trigger search on button click or Enter key
  const handleSearchButtonClick = () => {
    if (inputValue.trim().length >= 2) {
      // Re-trigger the search
      setLoading(true);
      searchWeatherStations(inputValue)
        .then((results) => {
          const mappedResults = results.map(station => ({
            id: station.station_id,
            name: station.station_name,
            state: station.station_state,
            elevation: station.station_height,
            startYear: station.station_start_year,
            endYear: station.station_end_year,
            latitude: station.location?.coordinates[1],
            longitude: station.location?.coordinates[0],
            original: station
          }));
          
          setOptions(mappedResults);
        })
        .catch(err => {
          console.error('Error searching for stations:', err);
          setOptions([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <div>
      <Autocomplete
        id="station-search"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={handleStationSelect}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionLabel={(option) => option.name || ''}
        options={options}
        loading={loading}
        noOptionsText={inputValue.trim().length < 2 
          ? "Type at least 2 characters to search" 
          : "No stations found - try a different search term"}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search for weather stations"
            placeholder="Enter station name, ID, or location"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton 
                    edge="start" 
                    onClick={handleSearchButtonClick}
                    disabled={inputValue.trim().length < 2}
                  >
                    {/* Use plain text symbol instead of icon */}
                    🔍
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
              onKeyDown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSearchButtonClick();
                }
              }
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', py: 0.5 }}>
              <Typography variant="body1" fontWeight="bold">
                {option.name}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mt: 0.5
              }}>
                <Typography variant="body2" color="text.secondary">
                  ID: {formatStationId(option.id)}
                </Typography>
                <Chip 
                  label={option.state || 'Unknown'} 
                  size="small" 
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
              {option.elevation !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  Elevation: {option.elevation}m • Years: {option.startYear || '?'} - {option.endYear || 'Present'}
                </Typography>
              )}
            </Box>
          </li>
        )}
      />
    </div>
  );
};

export default StationSearch; 