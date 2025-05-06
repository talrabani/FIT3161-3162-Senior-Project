// This script is used to process the average rainfall for every SA4 area by month
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');


// PostgreSQL connection configuration
const pgConfig = {
    host: process.env.POSTGRES_HOST || process.env.PGHOST || 'db', // Use the Docker service name
    port: parseInt(process.env.POSTGRES_PORT || process.env.PGPORT || '5432'),
    user: process.env.POSTGRES_USER || process.env.PGUSER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || process.env.PGDATABASE || 'weather_db',
    // Adjust connection settings for better stability
    connectionTimeoutMillis: 60000, // Increase to 60 seconds
    statement_timeout: 300000, // 5 minutes for statement execution (increased from 60 seconds)
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

// Function to process average rainfall, max temp, and min temp by month for each SA4 area
async function processAverageRainfallBySA4() {
    console.log('Starting to process average rainfall, max temp, and min temp by month for each SA4 area...');
    let pool = null;
    
    try {
        // Create connection pool with retry
        pool = await createPoolWithRetry(pgConfig);
        
        // Check if data already exists in the SA4_RAINFALL_MONTHLY table
        console.log('Checking if SA4 rainfall data already exists...');
        const existingDataResult = await pool.query('SELECT COUNT(*) FROM SA4_RAINFALL_MONTHLY');
        const existingCount = parseInt(existingDataResult.rows[0].count);
        
        if (existingCount > 0) {
            console.log(`Found ${existingCount} existing records in SA4_RAINFALL_MONTHLY table.`);
            console.log('Skipping processing as data already exists. To reprocess, manually truncate the table first.');
            return;
        }
        
        console.log('No existing data found. Proceeding with processing...');
        
        // First, clear existing data to avoid duplicates (as a precaution)
        console.log('Clearing existing data from SA4_RAINFALL_MONTHLY table...');
        await pool.query('TRUNCATE TABLE SA4_RAINFALL_MONTHLY');
        
        // Get the list of SA4 areas to process
        console.log('Getting the list of SA4 areas to process...');
        const sa4AreasResult = await pool.query(`
            SELECT DISTINCT sa4_code21 
            FROM SA4_BOUNDARIES
            ORDER BY sa4_code21
        `);
        
        const sa4Areas = sa4AreasResult.rows.map(row => row.sa4_code21);
        console.log(`Found ${sa4Areas.length} SA4 areas to process`);
        
        let totalRecordsInserted = 0;
        
        // Process each SA4 area separately
        for (let i = 0; i < sa4Areas.length; i++) {
            const sa4Code = sa4Areas[i];
            console.log(`Processing data for SA4 area ${sa4Code} (${i+1}/${sa4Areas.length})...`);
            
            // SQL to calculate average rainfall, max temp, and min temp by month for this SA4 area
            const query = `
                INSERT INTO SA4_RAINFALL_MONTHLY (sa4_code, year, month, rainfall, max_temp, min_temp)
                SELECT 
                    s.sa4_code,
                    EXTRACT(YEAR FROM r.date) AS year,
                    EXTRACT(MONTH FROM r.date) AS month,
                    AVG(r.rainfall) AS rainfall,
                    AVG(r.max_temp) AS max_temp,
                    AVG(r.min_temp) AS min_temp
                FROM 
                    RAINFALL_DATA_DAILY r
                JOIN 
                    STATION s ON r.station_id = s.station_id
                WHERE 
                    s.sa4_code = $1
                    AND (r.rainfall IS NOT NULL OR r.max_temp IS NOT NULL OR r.min_temp IS NOT NULL)
                GROUP BY 
                    s.sa4_code, 
                    EXTRACT(YEAR FROM r.date),
                    EXTRACT(MONTH FROM r.date)
                ORDER BY 
                    year, 
                    month;
            `;
            
            try {
                // Try executing the query with a specific timeout
                const result = await pool.query(query, [sa4Code]);
                console.log(`SA4 area ${sa4Code}: Inserted ${result.rowCount} records`);
                totalRecordsInserted += result.rowCount;
            } catch (error) {
                console.error(`Error processing SA4 area ${sa4Code}:`, error.message);
                // Log the error but continue with next SA4 area
                console.log(`Continuing with next SA4 area...`);
            }
            
            // Add a small delay between processing each SA4 area to reduce database load
            if (i < sa4Areas.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`Successfully processed all SA4 areas. Total records inserted: ${totalRecordsInserted}`);
        
        // Verify the data was inserted correctly
        const verificationResult = await pool.query('SELECT COUNT(*) FROM SA4_RAINFALL_MONTHLY');
        console.log(`Total records in SA4_RAINFALL_MONTHLY: ${verificationResult.rows[0].count}`);
        
        console.log('Process completed successfully.');
    } catch (error) {
        console.error('Error during SA4 rainfall processing:', error);
        throw error;
    } finally {
        if (pool) {
            console.log('Closing database connection...');
            await pool.end();
        }
    }
}

// Main execution
(async () => {
    try {
        console.log('Starting SA4 rainfall average calculation process...');
        await processAverageRainfallBySA4();
        console.log('Process completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error in main execution:', error);
        process.exit(1);
    }
})();
