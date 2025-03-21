#!/bin/bash

echo "Australian Weather Data Scraper"
echo "=============================="

echo "Installing dependencies..."
npm install

echo ""
echo "Starting the scraper..."
echo "The program will display the total number of weather stations in Australia."
echo "You will be prompted to enter a range of station numbers to process."
echo "You can leave both inputs blank to process all stations."
echo ""
npm run scrape

echo ""
echo "Scraping completed! Now processing the data..."
echo "The processor will automatically use the same station range without requiring any input."
echo "You can leave the program running unattended until completion."
echo ""
npm run process

echo ""
echo "All done! Your data is ready in the data/processed directory." 