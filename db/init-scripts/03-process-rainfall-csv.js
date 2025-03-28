// This script is used to process the rainfall CSV files and insert the data into the database

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

// Print environment variables for debugging (excluding sensitive data)
console.log('Environment variables:');
console.log('PGHOST:', process.env.PGHOST);
console.log('PGPORT:', process.env.PGPORT);
console.log('PGDATABASE:', process.env.PGDATABASE);
console.log('PGUSER:', process.env.PGUSER);

// PostgreSQL connection configuration
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

// Try multiple possible locations for the rainfall CSV directory
let rainfallCSVdir;
const possiblePaths = [
    '/db/data/extracted/rainfall',  // Based on docker-compose volume mapping
    path.join(__dirname, '..', 'data', 'extracted', 'rainfall'),  // Relative to script
    '/data/extracted/rainfall'  // Direct absolute path
];

// Find the first path that exists
for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
        rainfallCSVdir = testPath;
        console.log(`Found rainfall CSV directory at: ${rainfallCSVdir}`);
        break;
    }
}

if (!rainfallCSVdir) {
    console.error('Failed to find rainfall CSV directory in any expected location');
    console.error('Searched in:');
    possiblePaths.forEach(p => console.error(`  - ${p}`));
    process.exit(1);
}

// Insert function for row of rainfall data
// -- RAINFALL_DATA_DAILY table
// CREATE TABLE IF NOT EXISTS RAINFALL_DATA_DAILY (
//     station_id INTEGER(6),
//     date DATE,
//     rainfall DECIMAL(3,1),
//     PRIMARY KEY (station_id, date),
//     FOREIGN KEY (station_id) REFERENCES STATION(station_id) ON DELETE CASCADE
// );

async function insertRainfallData(filePath, pool) {
    console.log(`Processing file: ${filePath}`);
    
    // Extract station ID from filename (assuming filename format like "IDCJAC0009_1000_1800_Data.csv")
    // Station id is the 2nd term in the filename, if its less than 6 digits, pad with leading zeros
    const fileName = path.basename(filePath);
    const unpaddedStationId = fileName.split('_')[1];
    const stationId = unpaddedStationId.padStart(6, '0');
    
    if (isNaN(parseInt(stationId))) {
        console.error(`Could not extract station ID from filename: ${fileName}`);
        return;
    }
    
    let rowCount = 0;
    let successCount = 0;
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath) // Reads the csv file in chunks
            .pipe(csv.parse({ headers: true, trim: true })) // Parses the csv file
            .on('error', error => {
                console.error(`Error reading CSV file ${filePath}:`, error);
                reject(error);
            })
            .on('data', async row => {
                rowCount++;
                
                try {
                    // CSV has columns: Product code	Bureau of Meteorology station number	Year	Month	Day	Rainfall amount (millimetres)	Period over which rainfall was measured (days)	Quality
                    // We only want the date and rainfall amount
                    const date = new Date(row.Year, row.Month - 1, row.Day);
                    // Check if rainfall data exists and is valid, otherwise set to null
                    let rainfall = null;
                    if (row['Rainfall amount (millimetres)'] !== undefined && 
                        row['Rainfall amount (millimetres)'] !== '' && 
                        !isNaN(parseFloat(row['Rainfall amount (millimetres)']))) {
                        rainfall = parseFloat(row['Rainfall amount (millimetres)']);
                    }

                    // Insert into the RAINFALL_DATA_DAILY table
                    await pool.query(
                        `INSERT INTO RAINFALL_DATA_DAILY (station_id, date, rainfall) VALUES ($1, $2, $3)`,
                        [stationId, date, rainfall]
                    );

                    successCount++;
                    // console.log(`Inserted ${successCount} rows of ${rowCount} for station ${stationId}`);
                } catch (error) {
                    console.error(`Error inserting row ${rowCount} for station ${stationId}:`, error);
                }
            })
            .on('end', () => {
                console.log(`Processed ${rowCount === successCount ? 'all' : `${successCount} of ${rowCount}`} rows for station ${stationId}`);
                resolve({ rowCount, successCount });
            });
    });
}

/**
 * Process all CSV files in the directory
 * @returns {Promise<void>}
 */
async function processAllCSVFiles() {
    let pool;
    
    try {
        console.log(`Looking for CSV files in: ${rainfallCSVdir}`);
        
        // Create a connection pool with retry
        pool = await createPoolWithRetry(pgConfig);
        
        // Check if directory exists
        if (!fs.existsSync(rainfallCSVdir)) {
            console.error(`Directory not found: ${rainfallCSVdir}`);
            return;
        }
        
        // Get all CSV files
        const files = fs.readdirSync(rainfallCSVdir)
            .filter(file => file.toLowerCase().endsWith('.csv'));
        
        if (files.length === 0) {
            console.log('No CSV files found to process');
            return;
        }
        
        console.log(`Found ${files.length} CSV files to process`);
        
        // Process files one by one to avoid memory issues
        let processedCount = 0;
        let totalRowsProcessed = 0;
        
        for (const file of files) {
            const filePath = path.join(rainfallCSVdir, file);
            try {
                const result = await insertRainfallData(filePath, pool);
                if (result) {
                    totalRowsProcessed += result.successCount;
                }
                processedCount++;
                console.log(`Processed ${processedCount} of ${files.length} files`);
            } catch (error) {
                console.error(`Failed to process file ${file}:`, error);
            }
        }
        
        console.log(`Completed processing ${processedCount} of ${files.length} files`);
        console.log(`Total rows inserted: ${totalRowsProcessed}`);
    } catch (error) {
        console.error('Error processing CSV files:', error);
    } finally {
        // Close the database pool
        if (pool) {
            await pool.end();
            console.log('Database connection closed');
        }
    }
}

// Execute the script if run directly
if (require.main === module) {
    console.log('Starting rainfall data processing...');
    processAllCSVFiles().then(() => {
        console.log('Rainfall data processing completed');
    }).catch(error => {
        console.error('Error in rainfall data processing:', error);
        process.exit(1);
    });
}

// Export functions for use in other modules
module.exports = {
    insertRainfallData,
    processAllCSVFiles
};

            
            
                    
