// process_data.js
// Code to process downloaded weather data from BOM

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const csv = require('csv-parser');
const { Readable } = require('stream');
const readline = require('readline');

// Function to read total station count from stations.txt file
function getTotalStationCount() {
    try {
        if (fs.existsSync(path.join(__dirname, 'stations.txt'))) {
            const fileContent = fs.readFileSync(path.join(__dirname, 'stations.txt'), 'utf8');
            const lines = fileContent.split('\n');
            
            // Look for the total count at the bottom of the file
            // Format is simply a line with e.g. "19479 stations"
            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i].trim();
                const match = line.match(/^(\d+)\s+stations$/);
                if (match && match[1]) {
                    return parseInt(match[1]);
                }
            }
        }
        return "unknown";
    } catch (error) {
        console.error("Error reading station count:", error);
        return "unknown";
    }
}

// Function to parse stations.txt file and extract station information
function loadStationsFromFile() {
    try {
        const stationJson = {};
        if (fs.existsSync(path.join(__dirname, 'stations.txt'))) {
            const fileContent = fs.readFileSync(path.join(__dirname, 'stations.txt'), 'utf8');
            const lines = fileContent.split('\n');
            
            // Skip header lines (first 4 lines)
            for (let i = 4; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Skip empty lines, footer lines, or total count line
                if (!line || 
                    line.match(/^\d+\s+stations$/) || 
                    line.includes("Copyright") || 
                    line.includes("copyright") || 
                    line.includes("Cop") ||
                    line.includes("Please") ||
                    line.includes("-----")) {
                    continue;
                }
                
                // Basic validation: first segment should be 6-7 digit station number
                const firstSegment = line.substring(0, 7).trim();
                if (!firstSegment.match(/^\d{6,7}$/)) {
                    console.warn(`Skipping invalid line: ${line.substring(0, 30)}...`);
                    continue;
                }
                
                // Parse station data using fixed width format
                // Example: 001000 01    KARUNJIE                                    1940    1983 -16.2919  127.1956 .....          WA       320.0       ..     ..
                try {
                    const stationNum = firstSegment;
                    const district = line.substring(8, 13).trim();
                    
                    // Finding the name is tricky as it's variable width
                    let nameEnd = 50; // Approximate position where name ends
                    for (let j = 13; j < 50; j++) {
                        // Look for the start of year (4 digits)
                        if (line.substring(j, j+4).match(/^\d{4}$/)) {
                            nameEnd = j;
                            break;
                        }
                    }
                    
                    const stationName = line.substring(13, nameEnd).trim();
                    
                    // Continue parsing after name with fixed positions
                    const startPos = nameEnd;
                    const startYear = line.substring(startPos, startPos+8).trim();
                    const endYear = line.substring(startPos+8, startPos+16).trim() === '..' ? null : line.substring(startPos+8, startPos+16).trim();
                    const lat = line.substring(startPos+16, startPos+25).trim();
                    const lon = line.substring(startPos+25, startPos+35).trim();
                    const source = line.substring(startPos+35, startPos+48).trim() === '.....' ? null : line.substring(startPos+35, startPos+48).trim();
                    const state = line.substring(startPos+48, startPos+52).trim();
                    const height = line.substring(startPos+52, startPos+62).trim() === '..' ? null : line.substring(startPos+52, startPos+62).trim();
                    const barHeight = line.substring(startPos+62, startPos+72).trim() === '..' ? null : line.substring(startPos+62, startPos+72).trim();
                    const wmo = line.substring(startPos+72).trim() === '..' ? null : line.substring(startPos+72).trim();
                    
                    stationJson[stationNum] = {
                        district: district,
                        stationName: stationName,
                        startYear: startYear,
                        endYear: endYear,
                        latitude: lat,
                        longitude: lon,
                        source: source,
                        state: state,
                        height: height,
                        "bar height": barHeight,
                        wmo: wmo,
                        "Rainfall": null,
                        "Temperature": null
                    };
                } catch (parseError) {
                    console.error(`Error parsing line ${i+1}: ${line}`, parseError);
                    // Continue to next line
                }
            }
            
            // Validate the stations - display warning if something seems off
            const stationCount = Object.keys(stationJson).length;
            if (stationCount < 1000) {
                console.warn(`WARNING: Only found ${stationCount} stations, which seems low. There might be a parsing issue.`);
            } else {
                console.log(`Loaded ${stationCount} stations from stations.txt`);
            }
            
            return stationJson;
        } else {
            console.error("stations.txt file not found");
            return {};
        }
    } catch (error) {
        console.error("Error loading stations from file:", error);
        return {};
    }
}

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const RAINFALL_DIR = path.join(DATA_DIR, 'rainfall');
const TEMPERATURE_DIR = path.join(DATA_DIR, 'temperature');
const OUTPUT_DIR = path.join(DATA_DIR, 'processed');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// Load station data directly from stations.txt
const stationJson = loadStationsFromFile();

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to prompt user for input
function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// Process all downloaded data
async function processAllData(startStation, endStation) {
    console.log("Starting to process weather data...");
    
    // Get all station codes and filter based on range if provided
    let allStations = Object.keys(stationJson);
    let stations;
    
    if (startStation && endStation) {
        stations = allStations.filter(code => {
            return code >= startStation && code <= endStation;
        });
        console.log(`Processing stations from ${startStation} to ${endStation}`);
    } else {
        stations = allStations;
        console.log(`Processing all stations`);
    }
    
    console.log(`Found ${stations.length} stations to process`);
    
    // Create a map dataset for each station
    const mapData = {
        type: "FeatureCollection",
        features: []
    };
    
    let processedCount = 0;
    
    for (const stationCode of stations) {
        try {
            const stationInfo = stationJson[stationCode];
            const rainfilePath = path.join(RAINFALL_DIR, `${stationCode}_rainfall.zip`);
            const tempfilePath = path.join(TEMPERATURE_DIR, `${stationCode}_temperature.zip`);
            
            // Skip if either file doesn't exist
            if (!fs.existsSync(rainfilePath) || !fs.existsSync(tempfilePath)) {
                console.log(`Skipping station ${stationCode} - missing data files`);
                continue;
            }
            
            console.log(`Processing station ${stationCode} - ${stationInfo.stationName}`);
            
            // Extract and process rainfall data
            const rainfallData = await processZipFile(rainfilePath);
            
            // Extract and process temperature data
            const temperatureData = await processZipFile(tempfilePath);
            
            // Create station feature for GeoJSON
            if (stationInfo.latitude && stationInfo.longitude) {
                const stationFeature = {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [parseFloat(stationInfo.longitude), parseFloat(stationInfo.latitude)]
                    },
                    properties: {
                        id: stationCode,
                        name: stationInfo.stationName,
                        state: stationInfo.state,
                        district: stationInfo.district,
                        startYear: stationInfo.startYear,
                        endYear: stationInfo.endYear,
                        elevation: stationInfo.height,
                        rainfall: summarizeData(rainfallData),
                        temperature: summarizeData(temperatureData)
                    }
                };
                
                mapData.features.push(stationFeature);
            }
            
            // Save individual station data
            const stationOutputPath = path.join(OUTPUT_DIR, `${stationCode}.json`);
            fs.writeFileSync(stationOutputPath, JSON.stringify({
                stationInfo,
                rainfall: rainfallData,
                temperature: temperatureData
            }, null, 2));
            
            processedCount++;
            if (processedCount % 10 === 0) {
                console.log(`Processed ${processedCount} stations so far`);
            }
            
        } catch (error) {
            console.error(`Error processing station ${stationCode}:`, error);
        }
    }
    
    // Create a range-specific output filename if a range was specified
    let mapFilename = 'map_data.geojson';
    if (startStation && endStation) {
        mapFilename = `map_data_${startStation}_${endStation}.geojson`;
    }
    
    // Save the map data
    const mapOutputPath = path.join(OUTPUT_DIR, mapFilename);
    fs.writeFileSync(mapOutputPath, JSON.stringify(mapData, null, 2));
    
    console.log(`Processing complete. Processed ${processedCount} stations.`);
    console.log(`Map data saved to ${mapOutputPath}`);
    console.log(`Individual station data saved in ${OUTPUT_DIR}`);
    
    // Close the readline interface
    rl.close();
}

// Process a zip file containing CSV data
async function processZipFile(zipFilePath) {
    try {
        const zip = new AdmZip(zipFilePath);
        const zipEntries = zip.getEntries();
        
        // Find CSV entries
        const csvEntries = zipEntries.filter(entry => entry.entryName.endsWith('.csv'));
        
        if (csvEntries.length === 0) {
            console.warn(`No CSV files found in ${zipFilePath}`);
            return null;
        }
        
        // Process the first CSV file (usually there's just one)
        const csvEntry = csvEntries[0];
        const csvContent = zip.readAsText(csvEntry);
        
        // Parse CSV data
        const results = [];
        
        await new Promise((resolve, reject) => {
            const stream = Readable.from(csvContent);
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve())
                .on('error', (error) => reject(error));
        });
        
        return results;
    } catch (error) {
        console.error(`Error processing zip file ${zipFilePath}:`, error);
        return null;
    }
}

// Summarize data for map view (yearly averages)
function summarizeData(data) {
    if (!data || data.length === 0) return null;
    
    // Group by year
    const yearlyData = {};
    
    for (const record of data) {
        const date = record.Date || record.Year;
        if (!date) continue;
        
        // Extract year from date (could be YYYY or YYYY-MM-DD)
        const year = date.substring(0, 4);
        
        if (!yearlyData[year]) {
            yearlyData[year] = {
                values: [],
                count: 0
            };
        }
        
        // Try to find a numeric value (rainfall, max/min temp, etc.)
        for (const key in record) {
            const value = parseFloat(record[key]);
            if (!isNaN(value) && key !== 'Year' && key !== 'Month' && key !== 'Day') {
                yearlyData[year].values.push(value);
                yearlyData[year].count++;
                break; // We just need one value per record
            }
        }
    }
    
    // Calculate yearly averages
    const summary = Object.keys(yearlyData).map(year => {
        const { values, count } = yearlyData[year];
        if (count === 0) return null;
        
        const sum = values.reduce((a, b) => a + b, 0);
        return {
            year: parseInt(year),
            average: sum / count
        };
    }).filter(item => item !== null);
    
    // Sort by year
    return summary.sort((a, b) => a.year - b.year);
}

// Function to display available stations for user reference
async function displayAvailableStations() {
    const stationCodes = Object.keys(stationJson).sort();
    
    // Get the official total from stations.txt file
    const totalStationCount = getTotalStationCount();
    
    console.log("Available station range:");
    
    // Check if we have valid stations
    if (stationCodes.length === 0) {
        console.error("  ERROR: No valid stations were loaded from stations.txt");
        console.error("  Please check that stations.txt is correctly formatted and contains station data.");
        return;
    }
    
    // Verify that first and last stations look like valid station codes
    const firstStation = stationCodes[0];
    const lastStation = stationCodes[stationCodes.length-1];
    
    if (!firstStation.match(/^\d{6,7}$/) || !lastStation.match(/^\d{6,7}$/)) {
        console.error("  ERROR: Station data appears to be incorrectly parsed.");
        console.error("  First entry doesn't look like a station code:", firstStation);
        console.error("  Please check stations.txt format and parsing logic.");
        return;
    }
    
    console.log(`  First station: ${firstStation} - ${stationJson[firstStation].stationName}`);
    console.log(`  Last station: ${lastStation} - ${stationJson[lastStation].stationName}`);
    console.log(`  Total stations in Australia: ${totalStationCount}`);
    console.log(`  Stations in current dataset: ${stationCodes.length}`);
    
    // Display a few sample stations
    console.log("\nSample stations:");
    const sampleIndices = [0, Math.floor(stationCodes.length/4), Math.floor(stationCodes.length/2), 
                         Math.floor(3*stationCodes.length/4), stationCodes.length-1];
    
    for (const idx of sampleIndices) {
        const code = stationCodes[idx];
        console.log(`  ${code} - ${stationJson[code].stationName} (${stationJson[code].state})`);
    }
}

// Function to load the station range from the configuration file
function loadStationRange() {
    const configPath = path.join(__dirname, 'station_range.json');
    
    try {
        if (fs.existsSync(configPath)) {
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return {
                startStation: configData.startStation,
                endStation: configData.endStation,
                timestamp: configData.timestamp
            };
        }
    } catch (error) {
        console.error("Error loading station range configuration:", error);
    }
    
    return { startStation: '', endStation: '', timestamp: null };
}

// Run the data processor
(async () => {
    try {
        console.log("Australian Weather Data Processor");
        console.log("-------------------------------");
        
        await displayAvailableStations();
        
        // Load saved station range configuration
        const savedRange = loadStationRange();
        let startStation, endStation;
        
        if (savedRange.startStation || savedRange.endStation) {
            console.log("\nFound saved station range configuration:");
            if (savedRange.timestamp) {
                console.log(`  Created on: ${new Date(savedRange.timestamp).toLocaleString()}`);
            }
            
            if (savedRange.startStation && savedRange.endStation) {
                console.log(`  Station range: ${savedRange.startStation} to ${savedRange.endStation}`);
            } else if (savedRange.startStation) {
                console.log(`  Starting from station: ${savedRange.startStation}`);
            } else if (savedRange.endStation) {
                console.log(`  Up to station: ${savedRange.endStation}`);
            }
            
            // Automatically use the saved range without prompting
            startStation = savedRange.startStation;
            endStation = savedRange.endStation;
            console.log("Automatically using saved station range.");
        } else {
            console.log("\nNo saved station range found. Processing all available stations.");
            // If no saved range, process all stations
            startStation = '';
            endStation = '';
        }
        
        await processAllData(startStation, endStation);
    } catch (error) {
        console.error("Error in data processing:", error);
        rl.close();
    }
})(); 