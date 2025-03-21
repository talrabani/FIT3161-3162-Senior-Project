// process_data.js
// Code to process downloaded weather data from BOM

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const RAINFALL_DIR = path.join(DATA_DIR, 'rainfall');
const TEMPERATURE_DIR = path.join(DATA_DIR, 'temperature');
const OUTPUT_DIR = path.join(DATA_DIR, 'processed');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// Load station data
const stationJson = require('./test.json');

// Process all downloaded data
async function processAllData() {
    console.log("Starting to process weather data...");
    
    const stations = Object.keys(stationJson);
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
    
    // Save the map data
    const mapOutputPath = path.join(OUTPUT_DIR, 'map_data.geojson');
    fs.writeFileSync(mapOutputPath, JSON.stringify(mapData, null, 2));
    
    console.log(`Processing complete. Processed ${processedCount} stations.`);
    console.log(`Map data saved to ${mapOutputPath}`);
    console.log(`Individual station data saved in ${OUTPUT_DIR}`);
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

// Run the data processor
processAllData().catch(error => {
    console.error("Error in data processing:", error);
}); 