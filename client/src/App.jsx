import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { P } from './components/ui/typography'
import AustraliaMap from './components/map/AustraliaMap'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { useWeatherData } from './hooks/useWeatherData'
import MapSidebar from './components/ui/MapSidebar'
import Navbar from './components/ui/Navbar'
import DebugInfo from './components/ui/DebugInfo'
import './App.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
})

function WeatherApp() {
  const {
    selectedLocations,
    addLocation,
    removeLocation,
    dateRange,
    updateDateRange,
    chartType,
    toggleChartType,
    isLoading,
    isError,
  } = useWeatherData()
  
  // State for debugging panel visibility
  const [showDebug, setShowDebug] = useState(false);
  
  // State for SA4 boundaries and stations visibility
  const [showSA4Boundaries, setShowSA4Boundaries] = useState(true);
  const [showStations, setShowStations] = useState(true);
  
  // State for form data from the sidebar
  const [mapFormData, setMapFormData] = useState(null);
  
  return (
    <div className="app-container d-flex flex-column min-vh-100">
      <Navbar />
      
      <div className="container-fluid py-4 flex-grow-1">
        <div className="text-center mb-4">
          <P className="lead">
            Explore weather stations across Australia
          </P>
          <div className="mt-2">
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? 'Hide' : 'Show'} Debug Info
            </button>
          </div>
        </div>
        
        {showDebug && (
          <DebugInfo 
            selectedLocations={selectedLocations}
            showSA4Boundaries={showSA4Boundaries}
            setShowSA4Boundaries={setShowSA4Boundaries}
            showStations={showStations}
            setShowStations={setShowStations}
            dateRange={dateRange}
            chartType={chartType}
            isLoading={isLoading}
            isError={isError}
          />
        )}
        
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="card h-100">
              <div className="card-header">
                <h2 className="h5 mb-0">Interactive Map</h2>
              </div>
              <div className="card-body p-0" style={{ height: '700px' }}>
                <AustraliaMap 
                  selectedLocations={selectedLocations} 
                  onLocationSelect={addLocation}
                  showSA4Boundaries={showSA4Boundaries}
                  setShowSA4Boundaries={setShowSA4Boundaries}
                  showStations={showStations}
                  selectedDate={mapFormData ? mapFormData.selectedDate : null}
                  formData={mapFormData}
                />
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <MapSidebar onFormDataChange={setMapFormData} /> 
          </div>
        </div>
        
        {isError && (
          <div className="alert alert-danger mb-4" role="alert">
            <h4 className="alert-heading">Error!</h4>
            <p>
              There was an error loading the data. Please try again later or select different locations.
            </p>
          </div>
        )}
      </div>
      
      <footer className="text-center text-muted py-3 border-top">
        <P>
          Data provided by the Australian Bureau of Meteorology. Explore weather stations across Australia.
        </P>
        <small>© {new Date().getFullYear()} Australian Weather Explorer</small>
      </footer>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <WeatherApp />
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App
