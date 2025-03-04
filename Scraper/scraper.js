// Code written by Maddy Prazeus 31494978
// Last modified 03/03/2025

const puppeteer = require('puppeteer');
const fs = require('fs');

// stations.txt from here: http://www.bom.gov.au/climate/data/lists_by_element/stations.txt


var stationJson = require('./test.json');


async function scrapeStations(data) {
    //change headless to true, if u dont want chrome pop up
    const browser = await puppeteer.launch({
        args: ['--disable-features=HttpsUpgrades'],
        headless: false
    });

    
    let stationCodes = Object.keys(data)

    // Our browser tabs
    const pages = await browser.pages();

    // Main page where we select data type and station number
    const bomPage = pages[0];
    await bomPage.goto("http://www.bom.gov.au/climate/data/index.shtml");

    let index = 0;

    // Loop over all the inputted station codes
    for (const stationCode of stationCodes) {

        console.log("Scraping station: " + stationCode);

        //dont repeat scraping if data is already populated
        if (data[stationCode]["Rainfall"] != null || data[stationCode]["Temperature"] != null){
            console.log("Skipping");
            continue;
        }


        // Get Rainfall data for a station
        await selectAndSubmit(bomPage, stationCode, 2); // 2 = Rainfall
        let rainPage = await waitForNewPage(browser); // wait for new tab to load
        let rainResult = await extractData(rainPage); // extract download link
        rainPage.close();
        data[stationCode]["Rainfall"] = rainResult;

        await delay(); // pause for 1-4s

        // Get Temperature data for a station
        await selectAndSubmit(bomPage, stationCode, 3); // 3 = Temperature
        let tempPage = await waitForNewPage(browser);
        let tempResult = await extractData(tempPage);
        tempPage.close();
        data[stationCode]["Temperature"] = tempResult;

        //periodically save data in case of a crash
        if (index % 5 == 0){
            saveData(data);
        }
        index++;

        console.log("Scraped " + stationCode + " sucessfully");

        await delay();
    }

    await browser.close();
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
                resolve(newPage);
            }
        });
    });
}

// Helper function to extract data from the new page
async function extractData(page) {
    await page.waitForNetworkIdle({ timeout: 10000 });
    return await page.evaluate(() => {
        const links = document.querySelectorAll("ul[class='downloads'] > li");
        return links.length > 0 ? links[1].children[0].href : null;
    });
}

// Helper function to introduce a random delay
async function delay() {
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 3000 + 1000));
}

function saveData(jsonData) {
    fs.writeFile('test.json', JSON.stringify(jsonData), (err) => {
        if (err) {
            console.error('Error saving data:', err);
        } 
    });
}

// Run the scraper
(async () => {
    try {
        const output = await scrapeStations(stationJson);
        console.log(output);
    } catch (error) {
        console.error("Error scraping stations:", error);
    }
})();