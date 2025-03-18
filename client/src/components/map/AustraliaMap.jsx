import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { australianLocations } from '../../services/weatherApi';
import { P } from '../ui/typography';

// Mapbox API token
mapboxgl.accessToken = 'pk.eyJ1IjoidGFscmFiYW5pIiwiYSI6ImNtODJmdHZ0MzB0ZTkya3BpcGp3dTYyN2wifQ.nntDVPhkBzS5Zm5XuFybXg';

/**
 * Australia Map Component with selectable location markers using Mapbox
 */
export default function AustraliaMap({ selectedLocations = [], onLocationSelect }) {
  // Center of Australia approximate coordinates
  const centerPosition = [133.7751, -25.2744]; // [lng, lat]
  
  // Track locations being processed to prevent double-clicks
  const [processingLocations, setProcessingLocations] = useState([]);
  
  // Refs for DOM elements
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const popups = useRef({});
  
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