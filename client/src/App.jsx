import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Routes, Route, Navigate } from 'react-router-dom'
import { P } from './components/ui/typography'
import AustraliaMap from './components/map/AustraliaMap'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { useWeatherData } from './hooks/useWeatherData'
import MapSidebar from './components/ui/MapSidebar'
import Navbar from './components/ui/Navbar'
import DebugInfo from './components/ui/DebugInfo'
import SelectedStationsBox from './components/selectedStations/selectedStationsBox'
import StationComparisonPage from './pages/StationComparisonPage'
import AccountPage from './pages/AccountPage'
import { MapContextProvider, useMapContext } from './context/MapContext'
import { UnitProvider } from './context/UnitContext'
import LoginForm from './components/ui/LoginForm/LoginForm'
import SignupForm from './components/ui/SignupForm/SignupForm'
import AuthService from './services/auth.service'
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

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const currentUser = AuthService.getCurrentUser();
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  return children;
};

function WeatherApp() {
  const {
    selectedLocations,
    addLocation,
    removeLocation,
    clearLocations,
    isLoading,
    isError,
  } = useWeatherData();

  // Use MapContext for selected stations
  const { 
    selectedStations, 
    setSelectedStations,
    addStation,
    removeStation,
    dateRange,
    setDateRange
  } = useMapContext();

  // Load selected stations from localStorage on first mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('selectedStationsData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('Loaded stations from localStorage:', parsedData);
        setSelectedStations(parsedData);
      }
    } catch (error) {
      console.error('Error loading stations from localStorage:', error);
    }
  }, [setSelectedStations]);

  // Save selected stations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('selectedStationsData', JSON.stringify(selectedStations));
      console.log('Saved to localStorage:', selectedStations);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [selectedStations]);

  // Sync MapContext with useWeatherData on first load
  useEffect(() => {
    if (selectedLocations && selectedLocations.length > 0 && selectedStations.length === 0) {
      setSelectedStations(selectedLocations);
    }
  }, [selectedLocations, selectedStations, setSelectedStations]);

  // Ensure stations added through useWeatherData are also added to MapContext
  const handleLocationSelect = (location) => {
    addLocation(location);
    addStation(location);
  };

  // When removing a station, update both states
  const handleRemoveStation = (stationName) => {
    removeLocation(stationName);
    removeStation(stationName);
  };

  // Clear stations from both states
  const handleClearAllStations = () => {
    clearLocations();
    setSelectedStations([]);
    try {
      localStorage.removeItem('selectedStationsData');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };
  
  // State for debugging panel visibility
  const [showDebug, setShowDebug] = useState(false);
  
  // State for SA4 boundaries and stations visibility
  const [showSA4Boundaries, setShowSA4Boundaries] = useState(true);
  const [showStations, setShowStations] = useState(true);
  
  return (
    <div className="app-container d-flex flex-column min-vh-100">
      <Navbar />
      
      <div className="container-fluid py-4 flex-grow-1">
        
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="card h-100">
              <div className="card-body p-0" style={{ height: '700px' }}>
                <AustraliaMap 
                  selectedLocations={selectedStations} 
                  onLocationSelect={handleLocationSelect}
                  showSA4Boundaries={showSA4Boundaries}
                  setShowSA4Boundaries={setShowSA4Boundaries}
                  showStations={showStations}
                />
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <MapSidebar />
          </div>
        </div>
        
        <div className="row mt-4">
          <div className="col-12">
            <SelectedStationsBox 
              selectedStations={selectedStations}
              onRemoveStation={handleRemoveStation}
              clearAllStations={handleClearAllStations}
            />
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

      <div className="mt-2 text-center">
        <button 
          className="btn btn-sm btn-outline-secondary" 
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? 'Hide' : 'Show'} Debug Info
        </button>
      
        {showDebug && (
          <DebugInfo 
            selectedLocations={selectedStations}
            showSA4Boundaries={showSA4Boundaries}
            setShowSA4Boundaries={setShowSA4Boundaries}
            showStations={showStations}
            setShowStations={setShowStations}
            dateRange={dateRange}
            isLoading={isLoading}
            isError={isError}
          />
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
        <MapContextProvider>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/" element={
              <ProtectedRoute>
                <WeatherApp />
              </ProtectedRoute>
            } />
            <Route path="/comparison" element={
              <ProtectedRoute>
                <StationComparisonPage />
              </ProtectedRoute>
            } />
            <Route path="/account" element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            } />
          </Routes>
        </MapContextProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App
