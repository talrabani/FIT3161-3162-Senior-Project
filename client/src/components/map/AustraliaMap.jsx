import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchSA4Boundaries, fetchStationsBySA4, fetchAverageWeatherBySA4 } from '../../services/weatherApi';
import { P } from '../ui/typography';
import StationSelectCard from './MapStationSelectCard';
import { useMapContext } from '../../context/MapContext';
import chroma from 'chroma-js';  // Import chroma.js for color scaling

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
  const { selectedDate, selectedSA4, setSelectedSA4, selectedType } = useMapContext();
  
  // Center of Australia approximate coordinates
  const centerPosition = [133.7751, -25.2744]; // [lng, lat]
  
  // Track locations being processed to prevent double-clicks
  const [processingLocations, setProcessingLocations] = useState([]);
  
  // State for currently selected SA4 area and its stations
  const [stationsInSA4, setStationsInSA4] = useState([]);
  const stationMarkers = useRef({});
  const sa4DataLoaded = useRef(false);
  
  // State for the selected station
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedStationCoords, setSelectedStationCoords] = useState(null); // Store pixel coordinates - used to position the card of selected station
  
  // State for weather data
  const [weatherData, setWeatherData] = useState([]);
  const weatherDataLoaded = useRef(false);
  
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
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Fetch weather data when the selected date or type changes
  useEffect(() => {
    if (!selectedDate || !map.current) return;
    
    const fetchWeatherData = async () => {
      try {
        // Extract month and year from selected date
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0'); // +1 because getMonth() returns 0-11
        const year = selectedDate.getFullYear().toString();
        
        console.log(`Fetching weather data for month: ${month}, year: ${year}, type: ${selectedType}`);
        const data = await fetchAverageWeatherBySA4(month, year);
        
        if (!data || data.length === 0) {
          console.warn(`No weather data returned for month: ${month}, year: ${year}`);
          setWeatherData([]);
          return;
        }
        
        console.log(`Received ${data.length} SA4 weather records for ${month}/${year}`);
        
        // Check if we have the necessary data fields
        const firstRecord = data[0];
        console.log('Sample data record:', firstRecord);
        
        // Validate temperature data availability if that's the selected type
        if (selectedType === 'temperature') {
          const hasTempData = firstRecord && 
            (firstRecord.max_temp !== undefined || 
             firstRecord.avg_max_temp !== undefined || 
             firstRecord.temp !== undefined || 
             firstRecord.temperature !== undefined);
          
          if (!hasTempData) {
            console.warn('Temperature data is not available in the API response');
          }
        }
        
        setWeatherData(data);
        weatherDataLoaded.current = true;
        
        // Update map colors if boundaries are already loaded
        if (boundariesSourceAdded.current && map.current.getSource('sa4-boundaries')) {
          updateMapColors();
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setWeatherData([]);
      }
    };
    
    fetchWeatherData();
  }, [selectedDate, selectedType]);
  
  // Function to update map colors based on selected weather data type
  const updateMapColors = () => {
    if (!map.current || !boundariesSourceAdded.current || weatherData.length === 0) return;
    
    try {
      let dataField, legendTitle, colorStart, colorEnd;
      
      // Set properties based on selected type
      if (selectedType === 'rainfall') {
        dataField = 'rainfall';
        legendTitle = 'Rainfall (mm)';
        colorStart = '#e0f3ff';
        colorEnd = '#025196';
      } else { // temperature
        // Check what temp data fields are available in the first record
        const firstRecord = weatherData[0];
        const tempFields = ['max_temp', 'avg_max_temp', 'temp', 'temperature'];
        
        // Find the first available temperature field
        dataField = tempFields.find(field => 
          firstRecord && 
          firstRecord[field] !== undefined && 
          firstRecord[field] !== null
        ) || 'max_temp';
        
        legendTitle = 'Temperature (°C)';
        colorStart = '#ffffcc';
        colorEnd = '#ff3300';
      }
      
      console.log(`Using data field: ${dataField} for type: ${selectedType}`);
      
      // Extract values to determine min/max for color scale
      const values = weatherData
        .map(item => parseFloat(item[dataField]) || 0)
        .filter(val => !isNaN(val) && val !== 0); // Filter out zero values as they might be placeholders
      
      if (values.length === 0) {
        console.warn(`No valid ${selectedType} values found in data`);
        return;
      }
      
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      
      console.log(`${selectedType} range: ${minValue} to ${maxValue}`);
      
      // Create a color scale
      const colorScale = chroma.scale([colorStart, colorEnd]).domain([minValue, maxValue]);
      
      // Create a lookup object for SA4 code to data value
      const valueBySA4 = {};
      weatherData.forEach(item => {
        const value = parseFloat(item[dataField]);
        if (!isNaN(value)) {
          valueBySA4[item.sa4_code] = value;
        }
      });
      
      // Pre-compute the colors for each SA4 area
      const colorBySA4 = {};
      Object.entries(valueBySA4).forEach(([code, value]) => {
        colorBySA4[code] = colorScale(value).hex();
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
      
      // Update or create the legend
      updateLegend(minValue, maxValue, colorScale, legendTitle);
    } catch (error) {
      console.error('Error updating map colors:', error);
    }
  };
  
  // Helper function to update or create the legend
  const updateLegend = (minValue, maxValue, colorScale, legendTitle) => {
    let legend = document.getElementById('map-legend');
    
    // If legend doesn't exist, create it
    if (!legend) {
      legend = document.createElement('div');
      legend.id = 'map-legend';
      legend.style.position = 'absolute';
      legend.style.bottom = '20px';
      legend.style.left = '20px';
      legend.style.padding = '10px';
      legend.style.backgroundColor = 'white';
      legend.style.borderRadius = '4px';
      legend.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
      legend.style.zIndex = '10';
      mapContainer.current.appendChild(legend);
    }
    
    // Format the selected date for display
    const formattedDate = selectedDate ? 
      `${selectedDate.toLocaleString('default', { month: 'long' })} ${selectedDate.getFullYear()}` : 
      'Selected Date';
    
    // Update the legend content
    legend.innerHTML = `
      <h4 style="margin: 0 0 5px 0; font-size: 14px;">${legendTitle}</h4>
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${formattedDate}</p>
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <div style="width: 150px; height: 10px; background: linear-gradient(to right, ${colorScale(minValue).hex()}, ${colorScale(maxValue).hex()});"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px;">
        <span>${minValue.toFixed(1)}</span>
        <span>${maxValue.toFixed(1)}</span>
      </div>
    `;
  };
  
  // Load SA4 boundaries data when the toggle is switched on
  useEffect(() => {
    if (!map.current || !showSA4Boundaries) return;
    
    // Only add source and layer once, when the map is loaded
    const addBoundaries = async () => {
      try {
        if (!map.current.loaded()) {
          map.current.on('load', addBoundaries);
          return;
        }
        
        // Fetch SA4 boundaries GeoJSON data
        const boundariesData = await fetchSA4Boundaries();
        
        // Add source if it doesn't exist
        if (!boundariesSourceAdded.current) {
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
              'text-ignore-placement': false
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
            
            // Set the selected SA4 code which will trigger station fetching
            setSelectedSA4(props.code);
          });
          
          // Change cursor on hover
          map.current.on('mouseenter', 'sa4-boundaries-fill', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });
          
          map.current.on('mouseleave', 'sa4-boundaries-fill', () => {
            map.current.getCanvas().style.cursor = '';
          });
          
          boundariesSourceAdded.current = true;
          
          // Apply weather colors if we already have the data
          if (weatherDataLoaded.current && weatherData.length > 0) {
            updateMapColors();
          }
        } else {
          // Just update the data if source already exists
          map.current.getSource('sa4-boundaries').setData(boundariesData);
          
          // Re-apply color styling if we have weather data
          if (weatherDataLoaded.current && weatherData.length > 0) {
            updateMapColors();
          }
        }
      } catch (error) {
        console.error('Error adding SA4 boundaries to map:', error);
      }
    };
    
    addBoundaries();
  }, [showSA4Boundaries]);

  // Toggle SA4 boundary layer visibility
  useEffect(() => {
    if (!map.current || !boundariesSourceAdded.current) return;
    
    try {
      const visibility = showSA4Boundaries ? 'visible' : 'none';
      
      // Only attempt to set layer properties if the map is loaded and layers exist
      if (map.current.loaded() && 
          map.current.getLayer('sa4-boundaries-fill') && 
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
          setSelectedStation(station);
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
  
  // Add an effect to update the card position when the map moves
  useEffect(() => {
    if (!map.current || !selectedStation || !selectedStationCoords) return;
    
    // Function to update the position of the card based on the station's geographic location
    const updateCardPosition = () => {
      const lngLat = [
        selectedStation.location.coordinates[0],
        selectedStation.location.coordinates[1]
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
  }, [selectedStation]);
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
        ref={mapContainer} 
        className="australia-map-container w-100 h-100"
      ></div>
      
      {selectedStation && selectedStationCoords && (
        <div style={{ 
          position: 'absolute', 
          left: `${selectedStationCoords.x}px`,
          top: `${selectedStationCoords.y - 10}px`, // Position slightly above the marker
          transform: 'translate(-50%, -100%)', // Center horizontally and position above
          zIndex: 10 
        }}>
          <StationSelectCard 
            station={selectedStation}
            onClose={() => {
              setSelectedStation(null);
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
              setSelectedStation(null);
              setSelectedStationCoords(null);
            }}
          />
        </div>
      )}
    </div>
  );
} 