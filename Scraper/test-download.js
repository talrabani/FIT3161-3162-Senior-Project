const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const readline = require('readline');

// Function to parse stations.txt file and extract station information
function loadStationsFromFile() {
    try {
        const stationJson = {};
        if (fs.existsSync(path.join(__dirname, 'rainfall-stations.txt'))) {
            const fileContent = fs.readFileSync(path.join(__dirname, 'rainfall-stations.txt'), 'utf8');
            const lines = fileContent.split('\n');
            
            // Skip header lines (first 4 lines)
            for (let i = 2; i < lines.length; i++) {
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
                
                // console.log(stationIndex[1066]);
                
                // if (!firstSegment.match(/^\d{4,7}$/)) {
                //     console.warn(`Skipping invalid line: ${line.substring(0, 30)}...`);
                //     continue;
                // }
                // Parse station data using fixed width format
                // Example: 001000 01    KARUNJIE                                    1940    1983 -16.2919  127.1956 .....          WA       320.0       ..     ..
                try {
                    const stationNum = firstSegment.replace(/\D/g,'');
                    // console.log(stationNum);
                    // const stNumEnd = stationNum.slice(-1);

                    // Finding the name is tricky as it's variable width
                    let nameEnd = 50; // Approximate position where name ends
                    for (let j = 13; j < 50; j++) {
                        // Look for the start of year (4 digits)
                        if (line.substring(j, j+7).match(/^-\d{2}\.?\d+$/)) {
                            nameEnd = j;
                            break;
                        }
                    }
                    
                    const stationName = line.substring(stationNum.length, nameEnd).trim();
                    
                    // Continue parsing after name with fixed positions
                    const startPos = nameEnd;
                    const lat = line.substring(startPos, startPos+10).trim();
                    const lon = line.substring(startPos+10, startPos+19).trim();
                    const startYear = line.substring(startPos+23, startPos+28).trim();
                    const endYear = line.substring(startPos+32, startPos+36).trim();
                    // const source = line.substring(startPos+35, startPos+48).trim() === '.....' ? null : line.substring(startPos+35, startPos+48).trim();
                    // const state = line.substring(startPos+48, startPos+52).trim();
                    // const height = line.substring(startPos+52, startPos+62).trim() === '..' ? null : line.substring(startPos+52, startPos+62).trim();
                    // const barHeight = line.substring(startPos+62, startPos+72).trim() === '..' ? null : line.substring(startPos+62, startPos+72).trim();
                    // const wmo = line.substring(startPos+72).trim() === '..' ? null : line.substring(startPos+72).trim();
                    
                    stationJson[stationNum] = {
                        stationNo: stationNum,
                        stationName: stationName,
                        startYear: startYear,
                        endYear: endYear,
                        latitude: lat,
                        longitude: lon,
                        "Rainfall": null,
                        // "Temperature": null
                    };
                    // console.log(stationJson[stationNum]);
                } catch (parseError) {
                    console.error(`Error parsing line ${i+1}: ${line}`, parseError);
                    // Continue to next line
                }
            }
            
            // Validate the stations - display warning if something seems off
            const stationCount = Object.keys(stationJson).length;
            if (stationCount < 1000) {
                console.warn(`WARNING: Only found ${stationCount} stations, which seems low. There might be a parsing issue.`);
                // console.log()
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
function loadcValues(numOfStations) {
    const stationIndex = {};
    for (i = 0; i < numOfStations; i++) {
        const ind = `${1000 + i}`;
        stationIndex[ind] = null;
    }
    let intialC = 207991 + 297;
    for (const stIn of Object.keys(stationIndex)){
        let cdif;
        const stInLast = stIn.slice(-1);
        const stInNum = +(stIn);
        if (stInLast == '0' || stInLast == '5') {
            cdif = parseInt(stInNum*0.4 - 1);
        }
        if (stInLast == '1' || stInLast == '6') {
            cdif = parseInt(stInNum*0.4 + 0.6);
            // console.log(cdif + parseInt(stationNum));
        }
        if (stInLast == '2' || stInLast == '7') {
            cdif = parseInt(stInNum*0.4 - 0.8);
        }
        if (stInLast == '3' || stInLast == '8') {
            cdif = parseInt(stInNum*0.4 - 0.2);
        }
        if (stInLast == '4' || stInLast == '9') {
            cdif = parseInt(stInNum*0.4 + 0.4);
        }
        intialC += cdif;
        stationIndex[stIn] = intialC;
        // console.log(stationIndex);
    }
    return stationIndex;
}



// Load station data directly from stations.txt
var stationJson = loadStationsFromFile();
// Create directories for downloaded data
const DATA_DIR = path.join(__dirname, 'data');
const RAINFALL_DIR = path.join(DATA_DIR, 'rainfall');
const TEMPERATURE_DIR = path.join(DATA_DIR, 'temperature');


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

async function autoDownload(data) {
    let allStationCodes = Object.keys(data);
    // console.log(allStationCodes.at(1));
    const stInd = loadcValues(300018-1000);
    let stationsDownloaded = 0;
    for (const stationCode of allStationCodes) {
        // if (stationCode == allStationCodes.at(300)) {
        //     break
        // }
        
        // Define file paths
        const rainDestination = path.join(RAINFALL_DIR, `${stationCode}_rainfall.zip`);
        
        // Check if files already exist and skip if they do
        if (fs.existsSync(rainDestination)) {
            console.log(`  Skipping ${stationCode} - files already exist`);
            data[stationCode]["Rainfall"] = `file://${rainDestination}`;
            continue;
        }

        if (!fs.existsSync(rainDestination)) {
            // console.log();
            const hrefLink = `http://www.bom.gov.au/jsp/ncc/cdio/weatherData/av?p_display_type=dailyZippedDataFile&p_stn_num=${stationCode}&p_c=-${stInd[stationCode]}&p_nccObsCode=136&p_startYear=${stationJson[stationCode].startYear}`
            // console.log(hrefLink);
            console.log(`Downloading data from station ${stationCode}`);
            await downloadFile(hrefLink,rainDestination)
            stationsDownloaded++;
        }
    }
    console.log(`Downloaded ${stationsDownloaded}`);
}

// Run the scraper with user input
(async () => {
    try {
        await autoDownload(stationJson);
        // console.log("Downloading file");
        // await downloadFile("http://www.bom.gov.au/jsp/ncc/cdio/weatherData/av?p_display_type=dailyZippedDataFile&p_stn_num=2066&p_c=-862062&p_nccObsCode=136&p_startYear=1993",path.join(RAINFALL_DIR, '002066_rainfall.zip'))

    } catch (error) {
        console.error("Error using:", error);
    }
})();