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
        // If we can't find the total, return the count from the JSON file
        return Object.keys(stationJson).length;
    } catch (error) {
        console.error("Error reading station count:", error);
        return "unknown";
    }
}

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const RAINFALL_DIR = path.join(DATA_DIR, 'rainfall');
const TEMPERATURE_DIR = path.join(DATA_DIR, 'temperature');
const OUTPUT_DIR = path.join(DATA_DIR, 'processed');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// Load station data
const stationJson = require('./test.json');

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
    console.log(`  First station: ${stationCodes[0]} - ${stationJson[stationCodes[0]].stationName}`);
    console.log(`  Last station: ${stationCodes[stationCodes.length-1]} - ${stationJson[stationCodes[stationCodes.length-1]].stationName}`);
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

// Run the data processor
(async () => {
    try {
        console.log("Australian Weather Data Processor");
        console.log("-------------------------------");
        
        await displayAvailableStations();
        
        console.log("\nYou can specify a range of stations to process.");
        console.log("Leave blank to process all available stations.");
        
        // Get user input for station range
        const startStation = await prompt("Enter start station number: ");
        const endStation = await prompt("Enter end station number: ");
        
        await processAllData(startStation, endStation);
    } catch (error) {
        console.error("Error in data processing:", error);
        rl.close();
    }
})(); 