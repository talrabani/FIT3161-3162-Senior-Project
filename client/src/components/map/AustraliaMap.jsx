import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchSA4Boundaries, fetchStationsBySA4, fetchAverageWeatherBySA4, fetchAverageWeatherByRect, fetchYearlyWeatherBySA4 } from '../../services/weatherApi';
import StationSelectCard from './MapStationSelectCard';
import { useMapContext } from '../../context/MapContext';
import chroma from 'chroma-js';  // Import chroma.js for color scaling
import LoadingMap from './LoadingMap';  // Import the loading component
import MapLegendContainer from './MapLegend'; // Import the new MapLegend component
import './AustraliaMap.css';  // Import custom CSS
// import { SelectBoundingBox } from '../selectedStations/selectBoundingBox';

// Mapbox API token
mapboxgl.accessToken = 'pk.eyJ1IjoidGFscmFiYW5pIiwiYSI6ImNtODJmdHZ0MzB0ZTkya3BpcGp3dTYyN2wifQ.nntDVPhkBzS5Zm5XuFybXg';

/**
 * Australia Map Component with selectable location markers using Mapbox
 */
export default function AustraliaMap({ 
  onLocationSelect,
  showSA4Boundaries = true,
  setShowSA4Boundaries = () => {},
  showStations = true
}) {
  // Access shared data from context
  const { 
    selectedDate, 
    timeFrequency,
    selectedSA4, 
    setSelectedSA4, 
    selectedType,
    selectedMapStation,
    setSelectedMapStation,
    clearSelectedMapStation
  } = useMapContext();
  
  // Loading state
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isBoundariesLoaded, setIsBoundariesLoaded] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Center of Australia approximate coordinates
  const centerPosition = [133.7751, -25.2744]; // [lng, lat]
  
  // Track locations being processed to prevent double-clicks
  const [processingLocations, setProcessingLocations] = useState([]);
  
  // State for currently selected SA4 area and its stations
  const [stationsInSA4, setStationsInSA4] = useState([]);
  const stationMarkers = useRef({});
  const sa4DataLoaded = useRef(false);
  
  // State for coordinates which is view-specific
  const [selectedStationCoords, setSelectedStationCoords] = useState(null);
  
  // State for weather data
  const [weatherData, setWeatherData] = useState([]);
  const weatherDataLoaded = useRef(false);
  
  // State for legend data
  const [legendData, setLegendData] = useState({
    minValue: 0,
    maxValue: 0,
    colourScale: null,
    title: '',
    type: 'rainfall'
  });
  
  // Refs for DOM elements
  const mapContainer = useRef(null);
  const map = useRef(null);
  const boundariesSourceAdded = useRef(false);
  
  // Safely handle location selection
  const handleLocationSelect = (location) => {
    try {
      // Prevent selecting the same location multiple times
      if (processingLocations.includes(location.name)) {
        return;
      }
      
      // Mark this location as being processed
      setProcessingLocations(prev => [...prev, location.name]);
      
      // Call the parent handler
      onLocationSelect(location);
      
      // After a delay, remove this location from processing state
      setTimeout(() => {
        setProcessingLocations(prev => prev.filter(name => name !== location.name));
      }, 2000);
    } catch (error) {
      console.error('Error selecting location:', error);
      setProcessingLocations(prev => prev.filter(name => name !== location.name));
    }
  };
  
  // Create and initialize the map
  useEffect(() => {
    if (map.current) return; // Skip if already initialized
    
    console.log('Initializing map...');
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: centerPosition,
      zoom: 3.5
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    
    // Wait for the map to fully load
    map.current.on('load', () => {
      console.log('Map fully loaded');
      setIsMapLoaded(true);
      
      // Pre-fetch weather data as soon as the map loads
      if (selectedDate && (!weatherData || weatherData.length === 0)) {
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const year = selectedDate.getFullYear().toString();
        
        if (timeFrequency === 'year') {
          console.log(`Pre-fetching initial yearly weather data: ${year}`);
          
          fetchYearlyWeatherBySA4(year)
            .then(data => {
              if (data && data.length > 0) {
                console.log(`Received ${data.length} initial yearly weather records`);
                setWeatherData(data);
                weatherDataLoaded.current = true;
              }
            })
            .catch(error => {
              console.error('Error pre-fetching initial yearly weather data:', error);
            });
        } else {
          console.log(`Pre-fetching initial monthly weather data: ${month}/${year}`);
          
          fetchAverageWeatherBySA4(month, year)
            .then(data => {
              if (data && data.length > 0) {
                console.log(`Received ${data.length} initial monthly weather records`);
                setWeatherData(data);
                weatherDataLoaded.current = true;
              }
            })
            .catch(error => {
              console.error('Error pre-fetching initial monthly weather data:', error);
            });
        }
      }
    });
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Fetch weather data when the selected date or type changes or on initial load
  useEffect(() => {
    // Don't run if no date is selected
    if (!selectedDate) return;
    
    // Skip if map isn't initialized yet
    if (!map.current) return;
    
    // Reset data loaded state when starting to fetch
    setIsDataLoaded(false);
    
    const fetchWeatherData = async () => {
      try {
        // Extract data from selected date
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0'); // +1 because getMonth() returns 0-11
        const year = selectedDate.getFullYear().toString();
        
        let data;
        
        if (timeFrequency === 'year') {
          // Fetch yearly data when timeFrequency is 'year'
          console.log(`Fetching yearly weather data for year: ${year}, type: ${selectedType}`);
          data = await fetchYearlyWeatherBySA4(year);
        } else {
          // Fetch monthly data for all other frequencies
          console.log(`Fetching monthly weather data for month: ${month}, year: ${year}, type: ${selectedType}`);
          data = await fetchAverageWeatherBySA4(month, year);
        }
        
        if (!data || data.length === 0) {
          console.warn(`No weather data returned for ${timeFrequency === 'year' ? 'year: ' + year : 'month: ' + month + ', year: ' + year}`);
          setWeatherData([]);
          return;
        }
        
        console.log(`Received ${data.length} SA4 weather records for ${timeFrequency === 'year' ? year : month + '/' + year}`);
        
        // Check if we have the necessary data fields
        const firstRecord = data[0];
        console.log('Sample data record:', firstRecord);
        
        const hasRequestedData = firstRecord && firstRecord[selectedType] !== undefined;
        if (!hasRequestedData) {
          console.warn(`${selectedType} data is not available in the API response`);
        }
        console.warn(`${selectedType} data is not available in the API response`);
        
        setWeatherData(data);
        weatherDataLoaded.current = true;
        
        // Update map colors if boundaries are already loaded
        if (boundariesSourceAdded.current && map.current.getSource('sa4-boundaries')) {
          updateMapColors();
          // Set data loaded to true after everything is ready
          setIsDataLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setWeatherData([]);
        // Even on error, we should update the loading state
        setIsDataLoaded(true);
      }
    };
    
    fetchWeatherData();
  }, [selectedDate, selectedType, timeFrequency, weatherDataLoaded.current]);
  
  // Function to update map colors based on selected weather data type
  const updateMapColors = () => {
    if (!map.current) {
      console.log('Cannot update map colors: Map not initialized');
      return;
    }
    
    if (!boundariesSourceAdded.current) {
      console.log('Cannot update map colors: Boundaries not added yet');
      return;
    }
    
    if (!weatherData || weatherData.length === 0) {
      console.log('Cannot update map colors: No weather data available');
      return;
    }
    
    // Use the current weatherData state
    updateMapColorsWithData(weatherData);
  };
  
  // Function to update map colors using provided data
  const updateMapColorsWithData = (data) => {
    if (!map.current) {
      console.log('Cannot update map colors: Map not initialized');
      return;
    }
    
    if (!boundariesSourceAdded.current) {
      console.log('Cannot update map colors: Boundaries not added yet');
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('Cannot update map colors: No data provided');
      return;
    }
    
    try {
      console.log(`Updating map colors for ${selectedType} with ${data.length} data points (direct)`);
      let dataField, legendTitle, colourScale, colourStart, colourMid, colourEnd;
      
      // Set properties based on selected type
      dataField = selectedType;
      console.log(`Using data field: ${dataField} for type: ${selectedType}`);
      if (selectedType === 'rainfall') {
        dataField = 'rainfall';
        // Set different title based on timeFrequency
        if (timeFrequency === 'year') {
          legendTitle = 'Annual average rainfall (mm)';
        } else {
          legendTitle = 'Monthly average rainfall (mm)';
        }
        colourStart = 'rgb(255,255,255)';
        colourMid = 'rgb(0, 157, 255)';
        colourEnd = 'rgb(128, 0, 255)';
      } else { // temperature
        // Set different title based on timeFrequency
        if (timeFrequency === 'year') {
          legendTitle = 'Annual average temperature (°C)';
        } else {
          legendTitle = 'Monthly average temperature (°C)';
        }
        colourStart = 'rgb(0, 162, 255)';
        colourMid = 'rgb(255,255,0)';
        colourEnd = 'rgb(255, 0, 0)';
      }
      
      console.log(colourStart);
      
      // Extract values to determine min/max for display
      const values = data
        .map(item => parseFloat(item[dataField]) || 0)
        .filter(val => !isNaN(val) && val !== 0); // Filter out zero values as they might be placeholders
      
      if (values.length === 0) {
        console.warn(`No valid ${selectedType} values found in data`);
        return;
      }
      
      // Format colour scale with a standard range, unless data exceeds
      var minValue, midValue, maxValue;

      if (selectedType === 'rainfall') {
        minValue = 0;
        midValue = 10;
        maxValue = Math.max(...values, 20);
      } else {
        maxValue = Math.max(...values, 50);
        midValue = 20;
        minValue = Math.min(...values, -20);
      }
      
      console.log(`${selectedType} range: ${minValue} to ${maxValue}`);
      // console.log(Math.max(...values), Math.min(...values))
      
      // Create a color scale
      colourScale = chroma.scale([colourStart, colourMid, colourEnd]).domain([minValue, midValue, maxValue]);
      
      // Create a lookup object for SA4 code to data value
      const valueBySA4 = {};
      data.forEach(item => {
        if (!item.sa4_code) {
          console.warn('Item missing sa4_code:', item);
          return;
        }
        
        const value = parseFloat(item[dataField]);
        if (!isNaN(value)) {
          valueBySA4[item.sa4_code] = value;
        }
      });
      
      // Check if we have any values to display
      if (Object.keys(valueBySA4).length === 0) {
        console.warn('No valid SA4 values to display on map');
        return;
      }
      
      console.log(`Applying colors for ${Object.keys(valueBySA4).length} SA4 regions`);
      
      // Pre-compute the colors for each SA4 area
      const colorBySA4 = {};
      Object.entries(valueBySA4).forEach(([code, value]) => {
        colorBySA4[code] = colourScale(value).hex();
      });
      
      // Update the fill layer with data-driven style
      map.current.setPaintProperty('sa4-boundaries-fill', 'fill-color', [
        'match',
        ['get', 'code'],
        ...Object.entries(colorBySA4).flat(),
        '#cccccc' // Default color for areas with no data
      ]);
      
      // Set fill opacity
      map.current.setPaintProperty('sa4-boundaries-fill', 'fill-opacity', 0.7);
      
      // Update legend data state
      setLegendData({
        minValue,
        maxValue,
        colourScale,
        title: legendTitle,
        type: selectedType
      });
      
      console.log('Map colors updated successfully');
    } catch (error) {
      console.error('Error updating map colors with direct data:', error);
    }
  };
  
  // Load SA4 boundaries data once on initial mount
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    
    // Only add source and layer once, when the map is loaded
    const addBoundaries = async () => {
      try {
        // Skip if boundaries are already added
        if (boundariesSourceAdded.current) {
          console.log('Boundaries already loaded, skipping');
          return;
        }
        
        console.log('Loading boundaries for the first time');
        setIsBoundariesLoaded(false);
        
        // Fetch SA4 boundaries GeoJSON data
        const boundariesData = await fetchSA4Boundaries();
        
        console.log('Adding SA4 boundaries to map');
          map.current.addSource('sa4-boundaries', {
            type: 'geojson',
            data: boundariesData
          });
          
          // Add layer for SA4 boundaries
          map.current.addLayer({
            id: 'sa4-boundaries-fill',
            type: 'fill',
            source: 'sa4-boundaries',
            paint: {
              'fill-color': '#088',  // This will be overridden by data-driven style
              'fill-opacity': 0.1
          },
          layout: {
            visibility: showSA4Boundaries ? 'visible' : 'none'
            }
          });
          
          // Add layer for SA4 boundary lines
          map.current.addLayer({
            id: 'sa4-boundaries-line',
            type: 'line',
            source: 'sa4-boundaries',
            paint: {
              'line-color': '#088',
              'line-width': 1,
              'line-opacity': 0.5
          },
          layout: {
            visibility: showSA4Boundaries ? 'visible' : 'none'
            }
          });
          
          // Add layer for SA4 labels
          map.current.addLayer({
            id: 'sa4-boundaries-label',
            type: 'symbol',
            source: 'sa4-boundaries',
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 12,
              'text-variable-anchor': ['center'],
              'text-justify': 'auto',
              'text-allow-overlap': false,
            'text-ignore-placement': false,
            visibility: showSA4Boundaries ? 'visible' : 'none'
            },
            paint: {
              'text-color': '#088',
              'text-halo-color': '#fff',
              'text-halo-width': 1
            }
          });
          
          // Add popups for SA4 regions
          map.current.on('click', 'sa4-boundaries-fill', (e) => {
            if (!e.features || e.features.length === 0) return;
            
            const feature = e.features[0];
            const props = feature.properties;
            
            console.log(`SA4 boundary clicked: ${props.name} (${props.code}), current selectedSA4: ${selectedSA4}`);
            
            // Just set the code directly - we'll handle the toggling in a separate effect
            setSelectedSA4((currentSelectedSA4) => {
              if (currentSelectedSA4 === props.code) {
                // If it's the same boundary, unselect it
                console.log(`Unselecting SA4 boundary: ${props.name} (${props.code})`);
                return null;
              } else {
                // Otherwise, select the new boundary
                console.log(`Selecting SA4 boundary: ${props.name} (${props.code})`);
                return props.code;
              }
            });
          });
          
          // Change cursor on hover
          map.current.on('mouseenter', 'sa4-boundaries-fill', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });
          
          map.current.on('mouseleave', 'sa4-boundaries-fill', () => {
            map.current.getCanvas().style.cursor = '';
          });
          
          boundariesSourceAdded.current = true;
        setIsBoundariesLoaded(true);
          
        // Apply weather colors if we already have the data
        if (weatherDataLoaded.current && weatherData.length > 0) {
          console.log('Boundaries loaded and weather data available - applying colors');
            updateMapColors();
          setIsDataLoaded(true);
        } else {
          console.log('Boundaries loaded but weather data not available - fetching it now');
          
          // Fetch weather data right after boundaries are loaded if we don't have it
          if (selectedDate) {
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const year = selectedDate.getFullYear().toString();
            
            if (timeFrequency === 'year') {
              console.log(`Fetching yearly weather data after boundaries loaded: ${year}`);
              
              fetchYearlyWeatherBySA4(year)
                .then(data => {
                  if (data && data.length > 0) {
                    console.log(`Received ${data.length} yearly weather records after boundaries loaded`);
                    
                    // Update state
                    setWeatherData(data);
                    weatherDataLoaded.current = true;
                    
                    // Update colors directly with the data we just received
                    // Instead of waiting for state update
                    updateMapColorsWithData(data);
                    
                    setIsDataLoaded(true);
                  } else {
                    console.warn('No yearly weather data received after boundaries loaded');
                    setIsDataLoaded(true); // Mark as loaded even if no data
                  }
                })
                .catch(error => {
                  console.error('Error fetching yearly weather data after boundaries loaded:', error);
                  setIsDataLoaded(true); // Mark as loaded even on error
                });
            } else {
              console.log(`Fetching monthly weather data after boundaries loaded: ${month}/${year}`);
              
              fetchAverageWeatherBySA4(month, year)
                .then(data => {
                  if (data && data.length > 0) {
                    console.log(`Received ${data.length} monthly weather records after boundaries loaded`);
                    
                    // Update state
                    setWeatherData(data);
                    weatherDataLoaded.current = true;
                    
                    // Update colors directly with the data we just received
                    // Instead of waiting for state update
                    updateMapColorsWithData(data);
                    
                    setIsDataLoaded(true);
                  } else {
                    console.warn('No monthly weather data received after boundaries loaded');
                    setIsDataLoaded(true); // Mark as loaded even if no data
                  }
                })
                .catch(error => {
                  console.error('Error fetching monthly weather data after boundaries loaded:', error);
                  setIsDataLoaded(true); // Mark as loaded even on error
                });
            }
          } else {
            console.log('No date selected, cannot fetch weather data');
            setIsDataLoaded(true);
          }
        }
      } catch (error) {
        console.error('Error adding SA4 boundaries to map:', error);
        // Even on error, mark as loaded to prevent endless loading state
        setIsBoundariesLoaded(true);
      }
    };
    
    addBoundaries();
  }, [isMapLoaded]); // Only run when map is loaded, just once

  // Toggle SA4 boundary layer visibility without reloading boundaries
  useEffect(() => {
    if (!map.current || !boundariesSourceAdded.current) return;
    
    try {
      const visibility = showSA4Boundaries ? 'visible' : 'none';
      
      console.log(`Toggling boundary visibility to: ${visibility}`);
      
      // Only attempt to set layer properties if the map is loaded and layers exist
      if (map.current.getLayer('sa4-boundaries-fill') && 
          map.current.getLayer('sa4-boundaries-line') && 
          map.current.getLayer('sa4-boundaries-label')) {
        map.current.setLayoutProperty('sa4-boundaries-fill', 'visibility', visibility);
        map.current.setLayoutProperty('sa4-boundaries-line', 'visibility', visibility);
        map.current.setLayoutProperty('sa4-boundaries-label', 'visibility', visibility);
      }
    } catch (error) {
      console.error('Error toggling SA4 boundary visibility:', error);
    }
  }, [showSA4Boundaries]);
  
  // Fetch stations when an SA4 area is clicked and showStations is true
  useEffect(() => {
    if (!map.current || !selectedSA4 || !showStations) return;
    
    const fetchStations = async () => {
      try {
        console.log(`Fetching stations for SA4 code: ${selectedSA4}${selectedDate ? ` with date filter: ${selectedDate.toISOString().split('T')[0]}` : ''}`);
        const stations = await fetchStationsBySA4(selectedSA4, selectedDate);
        setStationsInSA4(stations);
      } catch (error) {
        console.error(`Error fetching stations for SA4 code ${selectedSA4}:`, error);
        setStationsInSA4([]);
      }
    };
    
    fetchStations();
  }, [selectedSA4, showStations, selectedDate]);
  
  // Display stations on the map when stationsInSA4 changes
  useEffect(() => {
    if (!map.current || !showStations || stationsInSA4.length === 0) {
      // Clear existing station markers if showStations is toggled off
      if (!showStations) {
        Object.values(stationMarkers.current).forEach(marker => marker.remove());
        stationMarkers.current = {};
      }
      return;
    }
    
    // Clear existing station markers
    Object.values(stationMarkers.current).forEach(marker => marker.remove());
    stationMarkers.current = {};
    
    // Add station markers to the map
    stationsInSA4.forEach(station => {
      try {
        // Only add markers for stations with valid location data
        if (!station.location || !station.location.coordinates) {
          console.warn(`Station ${station.station_name} has invalid location data`);
          return;
        }
        
        // Create marker element
        const el = document.createElement('div');
        el.className = 'mapboxgl-marker station-marker';
        el.style.width = '15px';
        el.style.height = '15px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#f00';
        el.style.border = '2px solid #fff';
        el.style.cursor = 'pointer';
        
        // Extract coordinates from location property
        const coordinates = station.location.coordinates;
        
        // Create marker with click handler instead of popup
        const marker = new mapboxgl.Marker(el)
          .setLngLat(coordinates)
          .addTo(map.current);
        
        // Add click event to marker
        el.addEventListener('click', () => {
          // Get the geographic coordinates of the station
          const lngLat = marker.getLngLat();
          
          // Convert to pixel coordinates (for positioning the card)
          const pixelCoords = map.current.project(lngLat);
          
          // Store both the station data and its pixel coordinates
          setSelectedMapStation(station);
          setSelectedStationCoords(pixelCoords);
        });
        
        // Store reference to marker
        stationMarkers.current[station.station_id] = marker;
      } catch (error) {
        console.error(`Error adding marker for station ${station.station_name}:`, error);
      }
    });
    
    // Zoom to fit all stations if there are any
    if (stationsInSA4.length > 0 && Object.keys(stationMarkers.current).length > 0) {
      // Create a bounds object
      const bounds = new mapboxgl.LngLatBounds();
      
      // Add each station's coordinates to the bounds
      stationsInSA4.forEach(station => {
        if (station.location && station.location.coordinates) {
          bounds.extend(station.location.coordinates);
        }
      });
      
      // Zoom map to fit all stations with some padding
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 10
        });
      }
    }
  }, [stationsInSA4, showStations]);
  
  // Watch for changes to selectedMapStation from the context
  useEffect(() => {
    if (!map.current || !selectedMapStation) return;
    
    // Check if the station has valid location data
    if (!selectedMapStation.location || !selectedMapStation.location.coordinates) {
      console.warn(`Station ${selectedMapStation.station_name} has invalid location data`);
      return;
    }
    
    // Extract coordinates from location property
    const coordinates = selectedMapStation.location.coordinates;
    
    // Find if we already have a marker for this station
    const existingMarker = stationMarkers.current[selectedMapStation.station_id];
    
    if (existingMarker) {
      // If we already have a marker for this station, just trigger a click on it
      console.log(`Station ${selectedMapStation.station_name} already has a marker, triggering click event`);
      
      // Get the geographic coordinates
      const lngLat = existingMarker.getLngLat();
      
      // Pan the map to the station
      map.current.flyTo({
        center: lngLat,
        zoom: 10,
        speed: 1.2
      });
      
      // Convert to pixel coordinates
      const pixelCoords = map.current.project(lngLat);
      setSelectedStationCoords(pixelCoords);
    } else {
      // If we don't have a marker for this station (e.g., selected from search),
      // pan to its location and create a temporary marker if needed
      console.log(`Flying to station ${selectedMapStation.station_name} (selected externally)`);
      
      // Pan the map to the station
      map.current.flyTo({
        center: coordinates,
        zoom: 10,
        speed: 1.2
      });
      
      // Set pixel coordinates based on the selected station's geographic location
      const pixelCoords = map.current.project(coordinates);
      setSelectedStationCoords(pixelCoords);
    }
  }, [selectedMapStation]);
  
  // Add an effect to update the card position when the map moves
  useEffect(() => {
    if (!map.current || !selectedMapStation || !selectedStationCoords) return;
    
    // Function to update the position of the card based on the station's geographic location
    const updateCardPosition = () => {
      if (!selectedMapStation || !selectedMapStation.location) return;
      
      const lngLat = [
        selectedMapStation.location.coordinates[0],
        selectedMapStation.location.coordinates[1]
      ];
      const newPixelCoords = map.current.project(lngLat);
      setSelectedStationCoords(newPixelCoords);
    };
    
    // Add event listeners for map movements
    map.current.on('move', updateCardPosition);
    map.current.on('zoom', updateCardPosition);
    
    // Clean up event listeners
    return () => {
      if (map.current) {
        map.current.off('move', updateCardPosition);
        map.current.off('zoom', updateCardPosition);
      }
    };
  }, [selectedMapStation, selectedStationCoords]);
  
  // Clean up markers when a boundary is unselected
  useEffect(() => {
    // If selectedSA4 becomes null (indicating unselection), clear the markers
    if (selectedSA4 === null) {
      console.log('Clearing station markers due to boundary unselect');
      
      // Clear any station markers from the map
      Object.values(stationMarkers.current).forEach(marker => marker.remove());
      stationMarkers.current = {};
      setStationsInSA4([]);
    }
  }, [selectedSA4]);
  
  // Show loading overlay if any of the loading states are true
  const isLoading = !isMapLoaded || !isBoundariesLoaded || !isDataLoaded;
  
  // Determine the appropriate loading message based on what's still loading
  const getLoadingMessage = () => {
    if (!isMapLoaded) return 'Initializing map...';
    if (!isBoundariesLoaded) return 'Loading boundary data...';
    if (!isDataLoaded) return 'Loading weather data...';
    return 'Loading map data...';
  };

  // Let users select region through mouse drag
  useEffect(() => {
      if (!map.current) return;
      const canvas = map.current.getCanvasContainer();
      let startPoint = null;
      let box = null;

      const mousePos = (e) => {
        const rect = canvas.getBoundingClientRect();
        return { 
          x: e.clientX - rect.left - canvas.clientLeft,
          y: e.clientY - rect.top - canvas.clientTop
        }
      }
      const onMouseDown = (e) => {
        if (!e.originalEvent.shiftKey) return;
        
        map.current.dragPan.disable();
        startPoint = e.point;
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };
  
      const onMouseMove = (e) => {
        if (!startPoint) return;
        
        const currentPoint = mousePos(e);
  
        if (!box) {
          box = document.createElement('div');
          box.id = 'selection-box';
          box.style.position = 'absolute';
          box.style.pointerEvents = 'none';
          mapContainer.current.appendChild(box);
        }
  
        const minX = Math.min(startPoint.x, currentPoint.x),
          maxX = Math.max(startPoint.x, currentPoint.x),
          minY = Math.min(startPoint.y, currentPoint.y),
          maxY = Math.max(startPoint.y, currentPoint.y);

        // Adjust width and xy position of the box element ongoing
        const pos = `translate(${minX}px, ${minY}px)`;
        box.style.transform = pos;
        box.style.width = maxX - minX + 'px';
        box.style.height = maxY - minY + 'px';
      };
  
      const onMouseUp = async (e) => {
        const endPoint = mousePos(e);

        const topLeft = map.current.unproject([startPoint.x, startPoint.y]);
        const bottomRight = map.current.unproject([endPoint.x, endPoint.y]);
        const bounds = [topLeft.lat, bottomRight.lat, topLeft.lng, bottomRight.lng];
        try {
          const res = await fetchAverageWeatherByRect(bounds);
          setStationsInSA4(res);
        } catch (err) {
          console.error('Error fetching stations in bounding box:', err);
        }
        // Clear existing station markers
        Object.values(stationMarkers.current).forEach(marker => marker.remove());
        stationMarkers.current = {};
        box.remove();
        box = null;
        // if (box && mapContainer.current.contains(box)) {
        // }
  
        startPoint = null;
        map.current.dragPan.enable();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
  
      map.current.on('mousedown', onMouseDown);
    }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
        ref={mapContainer} 
        className="australia-map-container w-100 h-100"
      ></div>
      
      {selectedMapStation && selectedStationCoords && (
        <div style={{ 
          position: 'absolute', 
          left: `${selectedStationCoords.x}px`,
          top: `${selectedStationCoords.y - 10}px`, // Position slightly above the marker
          transform: 'translate(-50%, -100%)', // Center horizontally and position above
          zIndex: 10 
        }}>
          <StationSelectCard 
            station={selectedMapStation}
            onClose={() => {
              clearSelectedMapStation();
              setSelectedStationCoords(null);
            }}
            onSelect={(station) => {
              // Convert station to location format expected by onLocationSelect
              const location = {
                name: station.station_name,
                id: station.station_id,
                latitude: station.location.coordinates[1],
                longitude: station.location.coordinates[0],
                state: station.station_state,
                elevation: station.station_height,
                startYear: station.station_start_year,
                endYear: station.station_end_year
              };
              
              onLocationSelect(location);
              clearSelectedMapStation();
              setSelectedStationCoords(null);
            }}
          />
        </div>
      )}
      
      {/* Map Legend */}
      {legendData.colourScale && (
        <MapLegendContainer 
          minValue={legendData.minValue}
          maxValue={legendData.maxValue}
          colorScale={legendData.colourScale}
          title={legendData.title}
          type={legendData.type}
          date={selectedDate}
          timeFrequency={timeFrequency}
          position="bottom-left"
        />
      )}
      
      {/* Loading overlay */}
      <LoadingMap 
        show={isLoading} 
        message={getLoadingMessage()} 
      />
    </div>
  );
} 