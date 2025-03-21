@echo off
echo Australian Weather Data Scraper
echo ==============================

echo Installing dependencies...
call npm install

echo.
echo Starting the scraper...
echo The program will display the total number of weather stations in Australia.
echo You will be prompted to enter a range of station numbers to process.
echo You can leave both inputs blank to process all stations.
echo.
call npm run scrape

echo.
echo Scraping completed! Now processing the data...
echo You will be prompted again for the range of stations to process.
echo For consistency, use the same range you entered for scraping.
echo.
call npm run process

echo.
echo All done! Your data is ready in the data/processed directory.
echo Press any key to exit.
pause > nul 