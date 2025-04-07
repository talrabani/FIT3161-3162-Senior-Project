import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchSA4Boundaries, fetchStationsBySA4 } from '../../services/weatherApi';
import { P } from '../ui/typography';

// Mapbox API token
mapboxgl.accessToken = 'pk.eyJ1IjoidGFscmFiYW5pIiwiYSI6ImNtODJmdHZ0MzB0ZTkya3BpcGp3dTYyN2wifQ.nntDVPhkBzS5Zm5XuFybXg';

/**
 * Australia Map Component with selectable location markers using Mapbox
 */
export default function AustraliaMap({ 
  selectedLocations = [], 
  onLocationSelect,
  showSA4Boundaries = false,
  setShowSA4Boundaries = () => {},
  showStations = false
}) {
  // Center of Australia approximate coordinates
  const centerPosition = [133.7751, -25.2744]; // [lng, lat]
  
  // Track locations being processed to prevent double-clicks
  const [processingLocations, setProcessingLocations] = useState([]);
  
  // State for currently selected SA4 area and its stations
  const [selectedSA4Code, setSelectedSA4Code] = useState(null);
  const [stationsInSA4, setStationsInSA4] = useState([]);
  const stationMarkers = useRef({});
  
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
              'fill-color': '#088',
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
            setSelectedSA4Code(props.code);
            
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`
                <div>
                  <strong>${props.name}</strong><br>
                  Code: ${props.code}<br>
                  State: ${props.state}<br>
                  Area: ${Math.round(props.area_sqkm)} km²
                </div>
              `)
              .addTo(map.current);
          });
          
          // Change cursor on hover
          map.current.on('mouseenter', 'sa4-boundaries-fill', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });
          
          map.current.on('mouseleave', 'sa4-boundaries-fill', () => {
            map.current.getCanvas().style.cursor = '';
          });
          
          boundariesSourceAdded.current = true;
        } else {
          // Just update the data if source already exists
          map.current.getSource('sa4-boundaries').setData(boundariesData);
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
    if (!map.current || !selectedSA4Code || !showStations) return;
    
    const fetchStations = async () => {
      try {
        console.log(`Fetching stations for SA4 code: ${selectedSA4Code}`);
        const stations = await fetchStationsBySA4(selectedSA4Code);
        setStationsInSA4(stations);
      } catch (error) {
        console.error(`Error fetching stations for SA4 code ${selectedSA4Code}:`, error);
        setStationsInSA4([]);
      }
    };
    
    fetchStations();
  }, [selectedSA4Code, showStations]);
  
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
        
        // Create popup with station details
        const popup = new mapboxgl.Popup({ closeButton: true, offset: [0, -10] })
          .setHTML(`
            <div>
              <strong>${station.station_name}</strong><br>
              ID: ${station.station_id}<br>
              State: ${station.station_state}<br>
              ${station.station_height ? `Elevation: ${station.station_height}m<br>` : ''}
              Years: ${station.station_start_year || 'N/A'} - ${station.station_end_year || 'Present'}
            </div>
          `);
        
        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat(coordinates)
          .setPopup(popup)
          .addTo(map.current);
        
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
  
  return (
    <div 
      ref={mapContainer} 
      className="australia-map-container w-100 h-100"
    ></div>
  );
} 