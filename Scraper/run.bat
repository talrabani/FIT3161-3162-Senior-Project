@echo off
echo Australian Weather Data Scraper
echo ==============================

echo Installing dependencies...
call npm install

echo.
echo Starting the scraper...
echo This may take several hours to complete.
echo You can close this window at any time and restart later.
echo.
call npm run scrape

echo.
echo Scraping completed! Now processing the data...
call npm run process

echo.
echo All done! Your data is ready in the data/processed directory.
echo Press any key to exit.
pause > nul 