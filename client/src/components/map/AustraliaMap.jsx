import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { australianLocations, fetchSA4Boundaries } from '../../services/weatherApi';
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
  
  // Refs for DOM elements
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const popups = useRef({});
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
  
  // Handle showing stations on the map (placeholder for future implementation)
  useEffect(() => {
    if (showStations) {
      console.log('Show stations functionality will be implemented later');
    }
  }, [showStations]);
  
  // Update markers based on locations and selected state
  useEffect(() => {
    if (!map.current) return;
    
    // Wait for map to load before adding markers
    const setupMarkers = () => {
      // Clear existing markers
      Object.values(markers.current).forEach(marker => marker.remove());
      markers.current = {};
      
      // Clear existing popups
      Object.values(popups.current).forEach(popup => popup.remove());
      popups.current = {};
      
      // Add markers for all locations
      australianLocations.forEach(location => {
        const isSelected = selectedLocations.some(
          (selectedLoc) => selectedLoc.name === location.name
        );
        const isProcessing = processingLocations.includes(location.name);
        
        // Create marker element
        const el = document.createElement('div');
        el.className = 'mapboxgl-marker';
        el.style.cursor = 'pointer';
        el.style.width = '20px';
        el.style.height = '30px';
        el.style.backgroundImage = `url(https://api.mapbox.com/v4/marker/pin-m${isSelected ? '+399c39' : '+1278A8'}@2x.png?access_token=${mapboxgl.accessToken})`;
        el.style.backgroundSize = 'cover';
        if (isSelected) {
          el.style.filter = 'brightness(1.2)';
        }
        
        // Create popup
        const popup = new mapboxgl.Popup({ closeButton: true, offset: [0, -30] })
          .setHTML(`
            <div class="text-center">
              <strong class="d-block mb-2">${location.name}, ${location.state}</strong>
              ${!isSelected ? `
                <button 
                  class="btn btn-sm ${isProcessing ? 'btn-secondary' : 'btn-primary'}"
                  id="select-${location.name.replace(/\s+/g, '-').toLowerCase()}"
                  ${selectedLocations.length >= 3 || isProcessing ? 'disabled' : ''}
                >
                  ${isProcessing ? 'Processing...' : 'Select Location'}
                </button>
              ` : `
                <div class="alert alert-success py-1 px-2 mb-0 mt-1">
                  <small>Location Selected</small>
                </div>
              `}
            </div>
          `);
        
        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([location.longitude, location.latitude])
          .setPopup(popup)
          .addTo(map.current);
        
        // Store references
        markers.current[location.name] = marker;
        popups.current[location.name] = popup;
        
        // Add click event listener to button when popup is open
        popup.on('open', () => {
          const buttonId = `select-${location.name.replace(/\s+/g, '-').toLowerCase()}`;
          setTimeout(() => {
            const button = document.getElementById(buttonId);
            if (button) {
              button.addEventListener('click', () => handleLocationSelect(location));
            }
          }, 10);
        });
      });
    };
    
    if (map.current.loaded()) {
      setupMarkers();
    } else {
      map.current.on('load', setupMarkers);
    }
    
    // Cleanup
    return () => {
      Object.values(markers.current).forEach(marker => marker.remove());
      Object.values(popups.current).forEach(popup => popup.remove());
    };
  }, [selectedLocations, processingLocations, onLocationSelect]);
  
  return (
    <div 
      ref={mapContainer} 
      className="australia-map-container w-100 h-100"
    ></div>
  );
} 