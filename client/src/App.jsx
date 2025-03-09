import { useState } from 'react'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { H1, P } from './components/ui/typography'
import AustraliaMap from './components/map/AustraliaMap'
import WeatherChart from './components/charts/WeatherChart'
import DateRangePicker from './components/ui/DateRangePicker'
// import SelectedLocations from './components/ui/SelectedLocations'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { useWeatherData } from './hooks/useWeatherData'
import './App.css'
// import scrapeStations from './Scraper/scraper'
// import * as stationJson from './Scraper/test.json';

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
    weatherData,
    isLoading,
    isError,
  } = useWeatherData()
  
  // State for debugging panel visibility
  const [showDebug, setShowDebug] = useState(false);
  
  return (
    <div className="container-fluid py-4">
      <div className="header">Interactive Visualisation of Spatial Data</div>
      <div id='overlay'>
        <form id='loginbox'>
          <div className='right'>
            <input type='button' value='Close'/>
          </div>
          <h2>Login Form</h2>
          <label class="login-toggle">
            <input type="checkbox"/>
            <span class="login-slider"></span>
          </label>
          <header className="text-center mb-4">
            <input type='email' placeholder='Email Address'/>
            <input type='password' placeholder='Password'/>
          </div>
          <div className='center'>
            <input type='button' value='Login'/>
          </div>
        </form>
      </div>
      <div className="right">
      <input type='button' onClick={on()} value='Login'/>
      </div>
      <div className="tutorial">
        <h1>Tutorial</h1>
        <p>Click below to start a walkthrough of our tool.</p>
        <input type='button' value='Start'/>
      </div>
      <div className='map'></div>
      <div className='container'>

      <form>
        <label>Area</label>
        <input type='search' placeholder='Enter a location'/>
        <label>Data About</label>
        <select>
          <option value="opt-rain">Rainfall</option>
          <option value="opt-temp">Temperature</option>
        </select>
        <label>Start Date</label>
        <input type='Date' placeholder='DD/MM/YYYY'/>
        <label>End Date</label>
        <input type='Date' placeholder='dd/mm/yyyy'/>
        <label>Collection Frequency</label>
        <select>
          <option value='opt-daily'>Daily</option>
          <option value='opt-monthly'>Monthly</option>
          <option value='opt-yearly'>Yearly</option>
        </select>
        <label>Statistical Type</label>
        <select>
          <option value="opt-avg">Average</option>
          <option value="opt-min">Minimum</option>
          <option value="opt-max">Maximum</option>
        </select>
      </form>
      </div>
      {/* <div>
        <H1 className="mb-2">Australian Weather Explorer</H1>
        <P className="lead">
          Compare temperature and rainfall data across Australia
        </P>
        <div className="mt-2">
          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide' : 'Show'} Debug Info
          </button>
        </div>
      </header>
      
      {showDebug && (
        <div className="alert alert-info mb-4 text-start">
          <h4 className="alert-heading">Debug Information</h4>
          <p>Selected Locations: {selectedLocations.length}</p>
          <ul>
            {selectedLocations.map(loc => (
              <li key={loc.name}>
                {loc.name} ({loc.latitude}, {loc.longitude}), Station ID: {loc.stationId}
              </li>
            ))}
          </ul>
          <p>Date Range: {dateRange.startDate} to {dateRange.endDate}</p>
          <p>Chart Type: {chartType}</p>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>Error: {isError ? 'Yes' : 'No'}</p>
          <hr />
          <p className="mb-0">Weather Data Status:</p>
          <ul>
            {weatherData.map(data => (
              <li key={data.location.name}>
                {data.location.name}: 
                {data.isLoading ? ' Loading' : ' Loaded'}, 
                {data.isError ? ' Has Error' : ' No Error'}, 
                Historical Data: {data.historicalData?.daily?.time?.length || 0} days,
                Forecast Data: {data.forecastData?.daily?.time?.length || 0} days,
                Observations: {data.observationData?.data?.length || 0} entries
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header">
              <h2 className="h5 mb-0">Interactive Map</h2>
            </div>
            <div className="card-body p-0" style={{ height: '500px' }}>
              <AustraliaMap 
                selectedLocations={selectedLocations} 
                onLocationSelect={addLocation} 
              />
            </div>
            <div className="card-footer">
              <small className="text-muted">Select up to 3 locations to compare weather data</small>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="row g-4">
            <div className="col-12">
              <SelectedLocations 
                selectedLocations={selectedLocations} 
                onRemoveLocation={removeLocation} 
              />
            </div>
            
            <div className="col-12">
              <DateRangePicker 
                startDate={dateRange.startDate} 
                endDate={dateRange.endDate} 
                onRangeChange={updateDateRange} 
              />
            </div>
          </div>
        </div>
      </div>
      
      {isError && (
        <div className="alert alert-danger mb-4" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>
            There was an error loading the weather data. Please try again later or select different locations.
          </p>
        </div>
      )}
      
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h4 mb-0">Data Visualization</h2>
            <div className="btn-group">
              <button 
                className={`btn ${chartType === 'temperature' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => toggleChartType()}
                disabled={chartType === 'temperature'}
              >
                Temperature
              </button>
              <button 
                className={`btn ${chartType === 'rainfall' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => toggleChartType()}
                disabled={chartType === 'rainfall'}
              >
                Rainfall
              </button>
            </div>
          </div>
          
          <ErrorBoundary>
            <WeatherChart 
              weatherData={weatherData} 
              chartType={chartType} 
            />
          </ErrorBoundary>
        </div>
      </div>
      
      <footer className="text-center text-muted py-3 mt-auto border-top">
        <P>
          Data provided by the Australian Bureau of Meteorology. Explore historical weather trends and forecasts.
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

function on() {
  var elem = document.getElementById("overlay");
  console.log(document.getElementById("overlay"));
  // style = window.getComputedStyle(elem);
  // style.setProperty("display","block")
  // document.getElementById("overlay").style.display = "block";
  // document.getElementById("loginbox").style.display = "block";
}

// function off() {
//   var elem = document.getElementById("overlay"),
//   style = window.getComputedStyle(elem);
//   style.setProperty("display","none")
//   // document.getElementById("overlay").style.display = "none";
//   // document.getElementById("loginbox").style.display = "none";
// }
export default App
