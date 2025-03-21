// Code written by Maddy Prazeus 31494978
// Last modified 03/03/2025

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// stations.txt from here: http://www.bom.gov.au/climate/data/lists_by_element/stations.txt
var stationJson = require('./test.json');

// Create directories for downloaded data
const DATA_DIR = path.join(__dirname, 'data');
const RAINFALL_DIR = path.join(DATA_DIR, 'rainfall');
const TEMPERATURE_DIR = path.join(DATA_DIR, 'temperature');

// Create directories if they don't exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(RAINFALL_DIR)) fs.mkdirSync(RAINFALL_DIR);
if (!fs.existsSync(TEMPERATURE_DIR)) fs.mkdirSync(TEMPERATURE_DIR);

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

async function scrapeStations(data) {
    //change headless to true, if u dont want chrome pop up
    const browser = await puppeteer.launch({
        args: ['--disable-features=HttpsUpgrades'],
        headless: false
    });

    let stationCodes = Object.keys(data);
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

            await delay(); // pause for 1-4s

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

        // Save data every 5 stations or if there's an error
        if (index % 5 === 0 || errorCount > 0) {
            saveData(data);
            console.log(`  Progress saved: ${successCount} successful, ${errorCount} errors`);
        }

        index++;
        await delay();
    }

    await browser.close();
    
    // Final save
    saveData(data);
    console.log(`Scraping completed: ${successCount} successful, ${errorCount} errors`);
    
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
                await newPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
                resolve(newPage);
            }
        });
    });
}

// Helper function to extract data from the new page
async function extractData(page) {
    try {
        await page.waitForNetworkIdle({ timeout: 20000 });
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
async function delay() {
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 3000 + 1000));
}

function saveData(jsonData) {
    const backupPath = path.join(__dirname, `backup_data_${Date.now()}.json`);
    const mainPath = path.join(__dirname, 'test.json');
    
    // First create a backup
    if (fs.existsSync(mainPath)) {
        fs.copyFileSync(mainPath, backupPath);
    }
    
    // Then save the new data
    fs.writeFileSync(mainPath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
            console.error('Error saving data:', err);
        }
    });
    
    console.log(`Data saved to ${mainPath} (backup at ${backupPath})`);
}

// Run the scraper
(async () => {
    try {
        console.log("Starting scraper for Australian weather stations...");
        const output = await scrapeStations(stationJson);
        console.log("Scraping completed successfully!");
    } catch (error) {
        console.error("Error scraping stations:", error);
    }
})();