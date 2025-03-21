#!/bin/bash

echo "Australian Weather Data Scraper"
echo "=============================="

echo "Installing dependencies..."
npm install

echo ""
echo "Starting the scraper..."
echo "This may take several hours to complete."
echo "You can interrupt this process (Ctrl+C) at any time and restart later."
echo ""
npm run scrape

echo ""
echo "Scraping completed! Now processing the data..."
npm run process

echo ""
echo "All done! Your data is ready in the data/processed directory." 