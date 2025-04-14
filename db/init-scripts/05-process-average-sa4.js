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

// Function to process average rainfall by month for each SA4 area
async function processAverageRainfallBySA4() {
    console.log('Starting to process average rainfall by month for each SA4 area...');
    let pool = null;
    
    try {
        // Create connection pool with retry
        pool = await createPoolWithRetry(pgConfig);
        
        // First, clear existing data to avoid duplicates
        console.log('Clearing existing data from SA4_RAINFALL_MONTHLY table...');
        await pool.query('TRUNCATE TABLE SA4_RAINFALL_MONTHLY');
        
        // SQL to calculate average rainfall by month for each SA4 area
        // This query:
        // 1. Joins RAINFALL_DATA_DAILY with STATION to get the SA4 code for each rainfall record
        // 2. Extracts year and month from the date
        // 3. Groups by SA4 code, year, and month
        // 4. Calculates the average rainfall for each group
        const query = `
            INSERT INTO SA4_RAINFALL_MONTHLY (sa4_code, year, month, rainfall)
            SELECT 
                s.sa4_code,
                EXTRACT(YEAR FROM r.date) AS year,
                EXTRACT(MONTH FROM r.date) AS month,
                AVG(r.rainfall) AS rainfall
            FROM 
                RAINFALL_DATA_DAILY r
            JOIN 
                STATION s ON r.station_id = s.station_id
            WHERE 
                s.sa4_code IS NOT NULL
                AND r.rainfall IS NOT NULL
            GROUP BY 
                s.sa4_code, 
                EXTRACT(YEAR FROM r.date),
                EXTRACT(MONTH FROM r.date)
            ORDER BY 
                s.sa4_code, 
                year, 
                month;
        `;
        
        console.log('Calculating and inserting average rainfall by month for each SA4 area...');
        const result = await pool.query(query);
        console.log(`Successfully inserted ${result.rowCount} records into SA4_RAINFALL_MONTHLY table.`);
        
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
