import { H4, P } from './typography';

/**
 * Component to display and manage selected locations
 */
export default function SelectedLocations({ selectedLocations, onRemoveLocation }) {
  if (!selectedLocations.length) {
    return (
      <div className="card h-100">
        <div className="card-header">
          <H4 className="mb-0">Selected Locations</H4>
        </div>
        <div className="card-body text-center">
          <P className="text-muted fst-italic">No locations selected</P>
          <P className="small mt-2">Select up to 3 locations on the map to compare weather data</P>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card h-100">
      <div className="card-header">
        <H4 className="mb-0">Selected Locations</H4>
      </div>
      <div className="card-body">
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
      <div className="card-footer">
        <P className="small mb-0">
          {selectedLocations.length < 3 
            ? `You can select ${3 - selectedLocations.length} more location${3 - selectedLocations.length === 1 ? '' : 's'}`
            : 'Maximum number of locations selected'}
        </P>
      </div>
    </div>
  );
} 