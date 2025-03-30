// This script is used to process the rainfall CSV files and insert the data into the database
// Currently processing 10 stations at a time, inserting 5000 rows at a time

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
    // Adjust connection settings for better stability
    connectionTimeoutMillis: 30000, // Increase to 30 seconds
    statement_timeout: 60000, // 60 seconds for statement execution
    max: 10, // Increase max clients in the pool
    idleTimeoutMillis: 60000, // How long a client is allowed to remain idle
    retryDelay: 2000, // Delay between connection retries
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
    const batchSize = 5000; // Rows to process at a time
    let batch = [];
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath) // Reads the csv file in chunks
            .pipe(csv.parse({ headers: true, trim: true })) // Parses the csv file
            .on('error', error => {
                console.error(`Error reading CSV file ${filePath}:`, error);
                reject(error);
            })
            .on('data', row => {
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

                    // Add to batch instead of inserting immediately
                    batch.push({
                        stationId,
                        date,
                        rainfall
                    });
                    
                    // When batch reaches batchSize, insert the batch
                    if (batch.length >= batchSize) {
                        processBatch();
                    }
                } catch (error) {
                    console.error(`Error processing row ${rowCount} for station ${stationId}:`, error);
                }
            })
            .on('end', async () => {
                // Process any remaining records in the batch
                if (batch.length > 0) {
                    await processBatch();
                }
                console.log(`Processed ${rowCount === successCount ? 'all' : `${successCount} of ${rowCount}`} rows for station ${stationId}`);
                resolve({ rowCount, successCount });
            });
            
        // Function to process a batch of records with retry logic
        async function processBatch() {
            const currentBatch = [...batch]; // Create a copy of the current batch
            batch = []; // Clear the original batch right away
            
            let retries = 0;
            const maxBatchRetries = 3;
            
            while (retries < maxBatchRetries) {
                try {
                    // Create a parameterized query for the entire batch
                    const values = [];
                    const placeholders = [];
                    let paramCount = 1;
                    
                    currentBatch.forEach(record => {
                        placeholders.push(`($${paramCount}, $${paramCount + 1}, $${paramCount + 2})`);
                        values.push(record.stationId, record.date, record.rainfall);
                        paramCount += 3;
                    });
                    
                    const query = `
                        INSERT INTO RAINFALL_DATA_DAILY (station_id, date, rainfall) 
                        VALUES ${placeholders.join(', ')}
                        ON CONFLICT (station_id, date) DO UPDATE 
                        SET rainfall = EXCLUDED.rainfall
                    `;
                    
                    const client = await pool.connect(); // Get a dedicated client
                    try {
                        await client.query('BEGIN'); // Start transaction
                        await client.query(query, values);
                        await client.query('COMMIT');
                        successCount += currentBatch.length;
                        console.log(`Successfully inserted batch of ${currentBatch.length} records for station ${stationId}`);
                        break; // Exit the retry loop if successful
                    } catch (error) {
                        await client.query('ROLLBACK');
                        throw error; // Rethrow to be caught by the outer try/catch
                    } finally {
                        client.release(); // Always release the client back to the pool
                    }
                } catch (error) {
                    retries++;
                    console.error(`Error inserting batch for station ${stationId} (attempt ${retries}/${maxBatchRetries}):`, error.message);
                    
                    if (retries === maxBatchRetries) {
                        console.error(`Failed to insert batch after ${maxBatchRetries} attempts for station ${stationId}`);
                        
                        // If still failing with a smaller batch size, try processing one by one as last resort
                        if (currentBatch.length > 50) {
                            console.log(`Splitting batch into smaller chunks for station ${stationId}`);
                            // Process in smaller chunks recursively
                            const chunkSize = Math.floor(currentBatch.length / 5);
                            for (let i = 0; i < currentBatch.length; i += chunkSize) {
                                const chunk = currentBatch.slice(i, i + chunkSize);
                                batch.push(...chunk); // Add back to the main batch for processing
                                if (batch.length >= 50) { // Process in very small chunks
                                    await processBatch();
                                }
                            }
                        }
                    } else {
                        // Wait before retrying
                        console.log(`Waiting ${retries * 1000}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, retries * 1000));
                    }
                }
            }
        }
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
        
        // Process files in batches to limit concurrent operations
        let processedCount = 0;
        let totalRowsProcessed = 0;
        const fileBatchSize = 10; // Process 10 files at a time
        
        for (let i = 0; i < files.length; i += fileBatchSize) {
            const fileBatch = files.slice(i, i + fileBatchSize);
            const filePromises = fileBatch.map(file => {
                const filePath = path.join(rainfallCSVdir, file);
                return insertRainfallData(filePath, pool)
                    .then(result => {
                        if (result) {
                            totalRowsProcessed += result.successCount;
                        }
                        processedCount++;
                        console.log(`Processed ${processedCount} of ${files.length} files`);
                        return result;
                    })
                    .catch(error => {
                        console.error(`Failed to process file ${file}:`, error);
                        processedCount++;
                        return null;
                    });
            });
            
            await Promise.all(filePromises);
            console.log(`Completed batch ${Math.floor(i / fileBatchSize) + 1} of ${Math.ceil(files.length / fileBatchSize)}`);
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

            
            
                    
