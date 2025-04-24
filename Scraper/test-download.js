const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const readline = require('readline');

// Function to parse stations.txt file and extract station information
function loadStationsFromFile(filename) {
    try {
        const stationJson = {};
        if (fs.existsSync(path.join(__dirname, filename))) {
            const fileContent = fs.readFileSync(path.join(__dirname, filename), 'utf8');
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
                
                // Parse station data using fixed width format
                // Example: 001000 01    KARUNJIE                                    1940    1983 -16.2919  127.1956 .....          WA       320.0       ..     ..
                try {
                    const stationNum = firstSegment.replace(/\D/g,'');

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
                    
                    stationJson[stationNum] = {
                        stationNo: stationNum,
                        stationName: stationName,
                        startYear: startYear,
                        endYear: endYear,
                        latitude: lat,
                        longitude: lon
                    };
                    // console.log(stationJson[stationNum]);
                } catch (parseError) {
                    console.error(`Error parsing line ${i+1}: ${line}`, parseError);
                    // Continue to next line
                }
            }
            console.log(`Loaded ${stationJson.length} stations from stations.txt`);
            return stationJson;
        } else {
            console.error(`${filename} file not found`);
            return {};
        }
    } catch (error) {
        console.error("Error loading stations from file:", error);
        return {};
    }
}

const stationJson = loadStationsFromFile('min-temp-stations.txt');

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

const firstStNum = 1005;
const lastStNum = 200869;

let curp_c = 218590;
function loadp_cValues(numOfStations) {
    const stationIndex = {};
    for (i = 0; i < numOfStations; i++) {
        const ind = `${firstStNum + i}`;
        stationIndex[ind] = null;
    }
    for (const stIn of Object.keys(stationIndex)){
        let cdif;
        const stInLast = stIn.slice(-1);
        const stInNum = +(stIn);
        if (stInLast == '0' || stInLast == '5') {
            cdif = parseInt(Math.round(stInNum*0.4 - 1));
        }
        if (stInLast == '1' || stInLast == '6') {
            cdif = parseInt(Math.round(stInNum*0.4 + 0.6));
        }
        if (stInLast == '2' || stInLast == '7') {
            cdif = parseInt(Math.round(stInNum*0.4 - 0.8));
        }
        if (stInLast == '3' || stInLast == '8') {
            cdif = parseInt(Math.round(stInNum*0.4 - 0.2));
        }
        if (stInLast == '4' || stInLast == '9') {
            cdif = parseInt(Math.round(stInNum*0.4 + 0.4));
        }
        curp_c += cdif;
        stationIndex[stIn] = curp_c;
    }
    return stationIndex;
}

async function autoDownload(nccObsCode, joinAtDir, zipSuffix) {
    const stInd = loadp_cValues(lastStNum);
    let stationsDownloaded = 0;
    for (const stationCode of Object.keys(stationJson)) {
        
        // Define file path
        const fileDestination = path.join(joinAtDir, `${stationCode}` + zipSuffix);
        
        // Check if files already exist and skip if they do
        if (fs.existsSync(fileDestination)) {
            console.log(`  Skipping ${stationCode} - files already exist`);
            continue;
        }

        if (!fs.existsSync(fileDestination)) {
            const hrefLink = `http://www.bom.gov.au/jsp/ncc/cdio/weatherData/av?p_display_type=dailyZippedDataFile&p_stn_num=${stationCode}&p_c=-${stInd[stationCode]}&p_nccObsCode=${nccObsCode}&p_startYear=${stationJson[stationCode].startYear}`
            console.log(`Downloading data from station ${stationCode}`);
            console.log(`p_stn_num=${stationCode}&p_c=-${stInd[stationCode]}&p_nccObsCode=${nccObsCode}&p_startYear=${stationJson[stationCode].startYear}`)
            await downloadFile(hrefLink,fileDestination)
            stationsDownloaded++;
        }
    }
    console.log(`Downloaded ${stationsDownloaded}`);
}

// Run the scraper with user input
(async () => {
    try {
        const dir = path.join(__dirname, 'min-temp')
        await autoDownload(123, dir, '_min-temp.zip');

    } catch (error) {
        console.error("Error using:", error);
    }
})();