import { H4, P } from './typography';

/**
 * Component to display and manage selected locations
 */
export default function SelectedLocations({ selectedLocations, onRemoveLocation }) {
  if (!selectedLocations.length) {
    return (
      <div>
        <div className="card-header">
          <p className='h5'>Selected Locations</p>
        </div>
        <div className="text-center">
          <p className="text-muted fst-italic">No locations selected</p>
          <p>Select up to 3 locations on the map to compare weather data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="card-header">
      <p className='h5'>Selected Locations</p>
      </div>
      <div>
        <div className="list-group">
          {selectedLocations.map((location) => (
            <div 
              key={location.name}
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
            >
              <div>
                <h5 className="mb-1">{location.name}</h5>
                <p className="mb-0 text-muted">{location.state}</p>
              </div>
              <button
                onClick={() => onRemoveLocation(location.name)}
                className="btn btn-sm btn-outline-danger rounded-circle"
                aria-label={`Remove ${location.name}`}
              >
                <i className="bi bi-x"></i>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p>
          {selectedLocations.length < 3 
            ? `You can select ${3 - selectedLocations.length} more location${3 - selectedLocations.length === 1 ? '' : 's'}`
            : 'Maximum number of locations selected'}
        </p>
      </div>
    </div>
  );
} 