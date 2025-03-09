import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { australianLocations } from '../../services/weatherApi';
import { P } from '../ui/typography';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';

// Custom marker icon
const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Selected location marker icon
const selectedMarkerIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Australia Map Component with selectable location markers
 */
export default function AustraliaMap({ selectedLocations = [], onLocationSelect }) {
  // Center of Australia approximate coordinates
  const centerPosition = [-25.2744, 133.7751];
  
  // Track locations being processed to prevent double-clicks
  const [processingLocations, setProcessingLocations] = useState([]);
  
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
  
  return (
    <div className="w-100 h-100">
      <MapContainer center={centerPosition} zoom={4} className="w-100 h-100">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {australianLocations.map((location) => {
          const isSelected = selectedLocations.some(
            (selectedLoc) => selectedLoc.name === location.name
          );
          const isProcessing = processingLocations.includes(location.name);
          
          return (
            <Marker 
              key={location.name}
              position={[location.latitude, location.longitude]} 
              icon={isSelected ? selectedMarkerIcon : markerIcon}
            >
              <Popup>
                <div className="text-center">
                  <strong className="d-block mb-2">{location.name}, {location.state}</strong>
                  {!isSelected && (
                    <button 
                      className={`btn btn-sm ${isProcessing ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleLocationSelect(location)}
                      disabled={selectedLocations.length >= 3 || isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Select Location'}
                    </button>
                  )}
                  {isSelected && (
                    <div className="alert alert-success py-1 px-2 mb-0 mt-1">
                      <small>Location Selected</small>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
} 