// Code written by Maddy Prazeus 31494978
// Last modified 03/03/2025

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
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

// Load station data directly from stations.txt
var stationJson = loadStationsFromFile();

// Create directories for downloaded data
const DATA_DIR = path.join(__dirname, 'data');
const RAINFALL_DIR = path.join(DATA_DIR, 'rainfall');
const TEMPERATURE_DIR = path.join(DATA_DIR, 'temperature');

// Create directories if they don't exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(RAINFALL_DIR)) fs.mkdirSync(RAINFALL_DIR);
if (!fs.existsSync(TEMPERATURE_DIR)) fs.mkdirSync(TEMPERATURE_DIR);

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

// Function to download files
function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const request = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'http://www.bom.gov.au/'
            }
        }, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirects
                downloadFile(response.headers.location, destination)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file: ${response.statusCode}`));
                return;
            }
            
            const file = fs.createWriteStream(destination);
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve(destination);
            });
            
            file.on('error', (err) => {
                fs.unlink(destination, () => {});
                reject(err);
            });
        });
        
        request.on('error', (err) => {
            reject(err);
        });
    });
}

async function scrapeStations(data, startStation, endStation) {
    //change headless to true, if u dont want chrome pop up
    const browser = await puppeteer.launch({
        args: ['--disable-features=HttpsUpgrades'],
        headless: false
    });

    let allStationCodes = Object.keys(data);
    
    // Filter station codes based on the range provided
    let stationCodes;
    if (startStation && endStation) {
        stationCodes = allStationCodes.filter(code => {
            return code >= startStation && code <= endStation;
        });
        console.log(`Processing stations from ${startStation} to ${endStation}`);
    } else {
        stationCodes = allStationCodes;
        console.log(`Processing all stations`);
    }
    
    console.log(`Found ${stationCodes.length} stations to process`);

    // Main page where we select data type and station number
    const pages = await browser.pages();
    const bomPage = pages[0];
    await bomPage.goto("http://www.bom.gov.au/climate/data/index.shtml");

    let index = 0;
    let successCount = 0;
    let errorCount = 0;

    // Loop over all the inputted station codes
    for (const stationCode of stationCodes) {
        try {
            console.log(`[${index+1}/${stationCodes.length}] Processing station: ${stationCode} - ${data[stationCode].stationName}`);

            // Define file paths
            const rainDestination = path.join(RAINFALL_DIR, `${stationCode}_rainfall.zip`);
            const tempDestination = path.join(TEMPERATURE_DIR, `${stationCode}_temperature.zip`);
            
            // Check if files already exist and skip if they do
            if (fs.existsSync(rainDestination) && fs.existsSync(tempDestination)) {
                console.log(`  Skipping ${stationCode} - files already exist`);
                data[stationCode]["Rainfall"] = `file://${rainDestination}`;
                data[stationCode]["Temperature"] = `file://${tempDestination}`;
                index++;
                continue;
            }

            // Get Rainfall data for a station
            if (!fs.existsSync(rainDestination)) {
                await selectAndSubmit(bomPage, stationCode, 2); // 2 = Rainfall
                let rainPage = await waitForNewPage(browser);
                let rainUrl = await extractData(rainPage);
                rainPage.close();

                if (rainUrl) {
                    console.log(`  Downloading rainfall data for ${stationCode}`);
                    await downloadFile(rainUrl, rainDestination);
                    data[stationCode]["Rainfall"] = `file://${rainDestination}`;
                    console.log(`  Rainfall data saved to ${rainDestination}`);
                } else {
                    console.log(`  No rainfall data available for ${stationCode}`);
                    data[stationCode]["Rainfall"] = null;
                }
            }

            // await delay(); // pause for 1-4s

            // Get Temperature data for a station
            if (!fs.existsSync(tempDestination)) {
                await selectAndSubmit(bomPage, stationCode, 3); // 3 = Temperature
                let tempPage = await waitForNewPage(browser);
                let tempUrl = await extractData(tempPage);
                tempPage.close();

                if (tempUrl) {
                    console.log(`  Downloading temperature data for ${stationCode}`);
                    await downloadFile(tempUrl, tempDestination);
                    data[stationCode]["Temperature"] = `file://${tempDestination}`;
                    console.log(`  Temperature data saved to ${tempDestination}`);
                } else {
                    console.log(`  No temperature data available for ${stationCode}`);
                    data[stationCode]["Temperature"] = null;
                }
            }

            successCount++;
            console.log(`  Successfully processed station ${stationCode}`);
        } catch (error) {
            console.error(`  Error processing station ${stationCode}:`, error);
            errorCount++;
        }

        // Save progress information every 5 stations or if there's an error
        if (index % 5 === 0 || errorCount > 0) {
            saveProgressData(data, successCount, errorCount);
            console.log(`  Progress saved: ${successCount} successful, ${errorCount} errors`);
        }

        index++;
        // await delay();
    }

    await browser.close();
    
    // Final save of progress information
    saveProgressData(data, successCount, errorCount);
    console.log(`Scraping completed: ${successCount} successful, ${errorCount} errors`);
    
    // Close the readline interface
    rl.close();
    
    return data;
}

// Helper function to select data type and submit the form
async function selectAndSubmit(page, stationCode, dataType) {
    await page.evaluate(async (stationCode, dataType) => {
        const selectElement = document.getElementById("ncc_obs_code_group");
        selectElement.value = dataType;

        // Trigger a 'change' event
        const event = new Event('change', { bubbles: true });
        selectElement.dispatchEvent(event);

        // Get station number input field and submit button
        let stationInput = document.querySelector("input[id='p_stn_num']");
        const button = document.querySelector("input[id='getData']");

        // Put station value in field and submit
        stationInput.value = stationCode;
        button.click();
    }, stationCode, dataType);
}

// Helper function to wait for a new page
async function waitForNewPage(browser) {
    return new Promise((resolve) => {
        browser.on('targetcreated', async (target) => {
            if (target.type() === 'page') {
                const newPage = await target.page();
                await newPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
                resolve(newPage);
            }
        });
    });
}

// Helper function to extract data from the new page
async function extractData(page) {
    try {
        await page.waitForNetworkIdle({ timeout: 10000 });
        return await page.evaluate(() => {
            const links = document.querySelectorAll("ul[class='downloads'] > li");
            return links.length > 0 ? links[1].children[0].href : null;
        });
    } catch (error) {
        console.error("Error extracting data:", error);
        return null;
    }
}

// Helper function to introduce a random delay
// async function delay() {
//     await new Promise((resolve) => setTimeout(resolve, Math.random() * 3000 + 1000));
// }

// Function to save progress data without creating full backups
function saveProgressData(jsonData, successCount, errorCount) {
    const progressPath = path.join(__dirname, 'scraper_progress.json');
    
    // Save minimal progress information, not the full data
    const progressData = {
        timestamp: new Date().toISOString(),
        successCount: successCount,
        errorCount: errorCount,
        completedStations: Object.keys(jsonData).filter(code => jsonData[code].Rainfall || jsonData[code].Temperature)
    };
    
    try {
        fs.writeFileSync(progressPath, JSON.stringify(progressData, null, 2));
        console.log(`Progress information saved to ${progressPath}`);
    } catch (err) {
        console.error('Error saving progress data:', err);
    }
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

// Function to save the station range to a configuration file
function saveStationRange(startStation, endStation) {
    const configPath = path.join(__dirname, 'station_range.json');
    const configData = {
        startStation: startStation || '',
        endStation: endStation || '',
        timestamp: new Date().toISOString()
    };
    
    try {
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
        console.log(`Station range configuration saved to ${configPath}`);
    } catch (error) {
        console.error("Error saving station range configuration:", error);
    }
}

// Run the scraper with user input
(async () => {
    try {
        console.log("Starting Australian Weather Station Data Scraper");
        console.log("----------------------------------------------");
        
        await displayAvailableStations();
        
        await downloadFile("http://www.bom.gov.au/jsp/ncc/cdio/weatherData/av?p_display_type=dailyZippedDataFile&p_stn_num=2066&p_c=-862062&p_nccObsCode=136&p_startYear=1993",path.join(RAINFALL_DIR, '002066_rainfall.zip'))
        console.log("\nYou can specify a range of stations to process.");
        console.log("Leave blank to process all stations.");
        
        // Get user input for station range
        const startStation = await prompt("Enter start station number: ");
        const endStation = await prompt("Enter end station number: ");
        
        // Save the station range for the processor script
        saveStationRange(startStation, endStation);
        console.log("\nStarting scraper for Australian weather stations...");
        const output = await scrapeStations(stationJson, startStation, endStation);
        console.log("Scraping completed successfully!");
        console.log("Now you can run 'npm run process' to process the downloaded data.");
        console.log("The processor will automatically use the same station range.");
    } catch (error) {
        console.error("Error scraping stations:", error);
    }
})();