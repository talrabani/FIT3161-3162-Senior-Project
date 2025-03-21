# Australian Weather Data Scraper

This project scrapes historical weather data from the Australian Bureau of Meteorology (BOM) for use in an interactive spatial map application.

## Features

- Scrapes rainfall and temperature data from all available weather stations in Australia
- Downloads data as zip files containing CSV data
- Processes the data into GeoJSON format suitable for interactive mapping
- Stores individual station data for detailed analysis
- Handles errors gracefully and includes backup functionality

## Prerequisites

- Node.js (version 14 or newer)
- npm (Node Package Manager)

## Installation

1. Clone this repository
2. Navigate to the Scraper directory
3. Install dependencies:

```bash
npm install
```

## Usage

There are two main scripts:

1. **Scraper**: Extracts data from the BOM website and downloads it as zip files
2. **Processor**: Extracts data from the zip files and converts it to JSON/GeoJSON format

### Run the Complete Process

To run both the scraper and processor in sequence:

```bash
npm start
```

### Run Individual Steps

To run only the scraper:

```bash
npm run scrape
```

To run only the processor (after scraping has completed):

```bash
npm run process
```

## Data Structure

The script creates the following directory structure:

```
Scraper/
├── data/
│   ├── rainfall/           # Downloaded rainfall data (ZIP files)
│   ├── temperature/        # Downloaded temperature data (ZIP files)
│   └── processed/          # Processed JSON and GeoJSON files
│       ├── map_data.geojson    # Combined data for all stations (for mapping)
│       └── [station_id].json   # Individual station data files
```

## Output Data Format

### Map Data (GeoJSON)

The `map_data.geojson` file contains:

- Geographic coordinates for each station
- Basic station information (name, state, district, etc.)
- Summarized yearly rainfall and temperature data

### Individual Station Data (JSON)

Each station's JSON file contains:

- Detailed station information
- Complete rainfall records
- Complete temperature records

## Note

- The scraping process may take several hours to complete due to the large number of stations and rate limiting
- It's recommended to run this on a stable internet connection
- The script includes backup functionality to prevent data loss in case of errors 