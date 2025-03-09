import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
// import scrapeStations from './Scraper/scraper'
// import * as stationJson from './Scraper/test.json';

function App() {
  const [count, setCount] = useState(0)
  // try {
  //   const output = scrapeStations(stationJson);
  //   console.log(output);
  // } catch (error) {
  //     console.error("Error scraping stations:", error);
  // }
  return (
    <>
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
          <div>
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
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
    </>
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
