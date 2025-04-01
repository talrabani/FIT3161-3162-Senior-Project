// This script is used to add all of the stations from stations.txt to the database

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Print environment variables for debugging (excluding sensitive data)
console.log('Environment variables:');
console.log('PGHOST:', process.env.PGHOST);
console.log('PGPORT:', process.env.PGPORT);
console.log('PGDATABASE:', process.env.PGDATABASE);
console.log('PGUSER:', process.env.PGUSER);

// PostgreSQL connection - when running in the PostgreSQL docker container
const pgConfig = {
    host: process.env.POSTGRES_HOST || process.env.PGHOST || 'db', // Use the Docker service name
    port: parseInt(process.env.POSTGRES_PORT || process.env.PGPORT || '5432'),
    user: process.env.POSTGRES_USER || process.env.PGUSER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || process.env.PGDATABASE || 'weather_db',
    // Add connection retry settings
    connectionTimeoutMillis: 10000, // 10 seconds
    max: 5, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
    retryDelay: 1000, // Delay between connection retries
    maxRetries: 5 // Maximum number of retries
};

console.log('Using PostgreSQL connection config:', {
    host: pgConfig.host,
    port: pgConfig.port,
    user: pgConfig.user,
    database: pgConfig.database
});

// Create a function to establish connection with retries
async function createPoolWithRetry(config, maxRetries = 5, delay = 1000) {
    let retries = 0;
    let pool;

    while (retries < maxRetries) {
        try {
            pool = new Pool(config);
            // Test the connection
            const result = await pool.query('SELECT NOW()');
            console.log('Successfully connected to PostgreSQL:', result.rows[0]);
            return pool;
        } catch (error) {
            retries++;
            console.error(`Connection attempt ${retries}/${maxRetries} failed:`, error.message);
            
            if (retries === maxRetries) {
                console.error('Maximum retry attempts reached. Connection failed.');
                throw error;
            }
            
            console.log(`Waiting ${delay}ms before retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Read the stations.txt file
// Try multiple possible locations for the stations file
let stationsFilePath;
let stations;

try {
    // First try the path based on docker-compose volume mapping
    stationsFilePath = '/db/data/stations.txt';
    stations = fs.readFileSync(stationsFilePath, 'utf8').split('\n');
    console.log(`Successfully read stations.txt from ${stationsFilePath}`);
} catch (error) {
    console.log(`Could not find stations.txt at ${stationsFilePath}, trying alternative paths...`);
    try {
        // Try an absolute path
        stationsFilePath = '/data/stations.txt';
        stations = fs.readFileSync(stationsFilePath, 'utf8').split('\n');
        console.log(`Successfully read stations.txt from ${stationsFilePath}`);
    } catch (error) {
        // Try a relative path
        stationsFilePath = path.join(__dirname, '..', 'data', 'stations.txt');
        try {
            stations = fs.readFileSync(stationsFilePath, 'utf8').split('\n');
            console.log(`Successfully read stations.txt from ${stationsFilePath}`);
        } catch (error) {
            console.error('Failed to find stations.txt file in any expected location');
            console.error('Searched in:');
            console.error('  - /db/data/stations.txt');
            console.error('  - /data/stations.txt');
            console.error(`  - ${path.join(__dirname, '..', 'data', 'stations.txt')}`);
            process.exit(1);
        }
    }
}

// Top few lines of stations.txt file
// // Bureau of Meteorology product IDCJMC0014.                                       Produced: 21 Mar 2025

//    Site  Dist  Site name                                 Start     End      Lat       Lon Source         STA Height (m)   Bar_ht    WMO
// ------- ----- ---------------------------------------- ------- ------- -------- --------- -------------- --- ---------- -------- ------
//  001000 01    KARUNJIE                                    1940    1983 -16.2919  127.1956 .....          WA       320.0       ..     ..
//  001001 01    OOMBULGURRI                                 1914    2012 -15.1806  127.8456 GPS            WA         2.0       ..     ..
//  001002 01    BEVERLEY SP                                 1959    1967 -16.5825  125.4828 .....          WA          ..       ..     ..

// Updated Station table structure
// CREATE TABLE IF NOT EXISTS STATION (
//     station_id INTEGER PRIMARY KEY,
//     station_name VARCHAR(100) NOT NULL,
//     station_location GEOMETRY(POINT, 4326) NOT NULL, -- Using SRID 4326 (WGS84) for GPS coordinates
//     station_height DECIMAL(6,1),
//     station_state CHAR(3) NOT NULL,
//     station_start_year INTEGER NOT NULL,
//     station_end_year INTEGER
// );

async function insertStations() {
    let stationCount = 0;
    let successCount = 0;
    let pool;

    try {
        console.log('Starting station data insertion... This may take a minute or two...');
        
        // Create a connection pool with retry
        pool = await createPoolWithRetry(pgConfig);

        const columns = stations[3].split(/\s+/);
        let columnIndexes = [];
        let totalLength = 0;
        for (let i = 0; i < columns.length; i++) {
            columnIndexes.push([totalLength, totalLength + columns[i].length]);
            totalLength += columns[i].length + 1;
        }

        // Skip header lines and process each station line
        for (let i = 4; i < stations.length; i++) {
            const line = stations[i].trim();
            if (!line) continue;
            if (line.includes('stations')) {
                // Check if this is the summary line that says "19479 stations"
                if (line.match(/^\d+\s+stations$/)) {
                    console.log(`Reached end of station data: ${line}`);
                    break;
                }
            }
            
            stationCount++;
            
            // Parse the station data from the fixed-width format
            const stationId = line.substring(columnIndexes[0][0], columnIndexes[0][1]).trim();
            const stationName = line.substring(columnIndexes[2][0], columnIndexes[2][1]).trim();
            const startYearRaw = line.substring(columnIndexes[3][0], columnIndexes[3][1]).trim();
            const endYearRaw = line.substring(columnIndexes[4][0], columnIndexes[4][1]).trim();
            const latitude = line.substring(columnIndexes[5][0], columnIndexes[5][1]).trim();
            const longitude = line.substring(columnIndexes[6][0], columnIndexes[6][1]).trim();
            const state = line.substring(columnIndexes[8][0], columnIndexes[8][1]).trim();
            const heightRaw = line.substring(columnIndexes[9][0], columnIndexes[9][1]).trim();
            
            // Handle special cases
            const startYear = startYearRaw;
            const endYear = endYearRaw === '..' ? new Date().getFullYear() : endYearRaw;
            const height = heightRaw === '..' ? null : heightRaw;
            
            // Format as PostGIS Point using SRID 4326 (WGS84)
            // Using ST_SetSRID and ST_MakePoint to create a POINT geometry
            
            // Insert into database with the new GeoJSON structure
            await pool.query(
                `INSERT INTO STATION (
                    station_id, station_name, station_location, 
                    station_height, station_state, station_start_year, station_end_year
                ) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8)
                ON CONFLICT (station_id) DO UPDATE 
                SET station_name = $2, 
                    station_location = ST_SetSRID(ST_MakePoint($3, $4), 4326), 
                    station_height = $5, 
                    station_state = $6,
                    station_start_year = $7,
                    station_end_year = $8`,
                [
                    stationId, 
                    stationName, 
                    longitude, // Note: longitude is first in PostGIS point format (x, y)
                    latitude,  // latitude is second in PostGIS point format (x, y)
                    height, 
                    state, 
                    startYear, 
                    endYear
                ]
            );
            
            successCount++;
        }
        
        console.log(`Successfully inserted ${successCount} of ${stationCount} stations`);
    } catch (error) {
        console.error('Error inserting station data:', error);
    } finally {
        // Close the database pool
        await pool.end();
        console.log('Station processing completed');
    }
}

// Execute the script
insertStations().catch(error => {
    console.error('Error:', error);
    process.exit(1);
}); 