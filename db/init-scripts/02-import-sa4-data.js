const fs = require('fs');
const { exec } = require('child_process');
const { Pool } = require('pg');
const path = require('path');

// Configure database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'weather_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

// Path to shapefile in the data directory 
const shapefilePath = '/db/data/Statistical_Areas_Level_4_Shapefile/SA4_2021_AUST_GDA2020.shp';

async function importSA4Data() {
  console.log('Starting SA4 data import...');
  
  try {
    // Check if shapefile exists
    if (!fs.existsSync(shapefilePath)) {
      console.error(`Error: Shapefile not found at path: ${shapefilePath}`);
      return;
    }
    
    console.log(`Shapefile found at: ${shapefilePath}`);
    
    // Check if data already exists
    const client = await pool.connect();
    try {
      // Simple direct check for SA4_BOUNDARIES table
      try {
        console.log('Checking if SA4_BOUNDARIES table exists and has data...');
        const dataCountResult = await client.query("SELECT COUNT(*) FROM SA4_BOUNDARIES");
        const count = parseInt(dataCountResult.rows[0].count);
        
        if (count > 0) {
          console.log(`SA4 data already exists in the database (${count} records). Skipping import.`);
          return;
        }
        
        console.log('SA4_BOUNDARIES table exists but has no data. Proceeding with import...');
      } catch (tableErr) {
        console.error('Error: SA4_BOUNDARIES table does not exist or cannot be accessed.');
        console.error(tableErr);
        return;
      }
      
      // Using shp2pgsql to convert shapefile to SQL commands and create a temporary table
      const command = `shp2pgsql -s 4326 -I ${shapefilePath} sa4_temp | psql -U ${process.env.POSTGRES_USER} -d ${process.env.POSTGRES_DB}`;
      
      console.log(`Running import command: ${command}`);
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing shp2pgsql command: ${error.message}`);
          if (stderr) console.error(`stderr: ${stderr}`);
          return;
        }
        
        if (stdout) console.log(`stdout: ${stdout}`);
        
        console.log('Shapefile imported to temporary table. Transferring to main table...');
        
        try {
          // List the columns in the temp table to adapt our query
          const columnsResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'sa4_temp'
          `);
          
          const columns = columnsResult.rows.map(row => row.column_name);
          console.log(`Columns in temporary table: ${columns.join(', ')}`);
          
          // Map the temp table columns to our destination table
          // We need to check if the needed columns exist
          const sa4CodeColumn = columns.find(col => col.toLowerCase().includes('sa4_code'));
          const sa4NameColumn = columns.find(col => col.toLowerCase().includes('sa4_name'));
          const steCodeColumn = columns.find(col => col.toLowerCase().includes('ste_code'));
          const steNameColumn = columns.find(col => col.toLowerCase().includes('ste_name'));
          const areaColumn = columns.find(col => col.toLowerCase().includes('area'));
          const lociUriColumn = columns.find(col => col.toLowerCase().includes('loci_uri'));
          
          if (!sa4CodeColumn || !sa4NameColumn) {
            console.error('Required columns not found in the temporary table');
            return;
          }
          
          // Transfer data from temporary table to main table
          const insertQuery = `
            INSERT INTO SA4_BOUNDARIES (
              sa4_code21, sa4_name21, ste_code21, ste_name21, areasqkm21, loci_uri21, geometry
            )
            SELECT 
              ${sa4CodeColumn}, 
              ${sa4NameColumn}, 
              ${steCodeColumn || 'NULL'}, 
              ${steNameColumn || 'NULL'}, 
              ${areaColumn || 'NULL'}, 
              ${lociUriColumn || 'NULL'}, 
              ST_Transform(geom, 4326) as geometry
            FROM sa4_temp;
          `;

          await client.query(insertQuery);
          
          // Count how many records were imported
          const countAfterResult = await client.query("SELECT COUNT(*) FROM SA4_BOUNDARIES");
          const countAfter = parseInt(countAfterResult.rows[0].count);
          
          console.log(`Successfully imported ${countAfter} SA4 boundaries`);
          
          // Drop temporary table
          await client.query('DROP TABLE IF EXISTS sa4_temp');
          
          console.log('SA4 data import completed successfully');
        } catch (err) {
          console.error('Error transferring data:', err);
        }
      });
      
    } catch (err) {
      console.error('Error during database operations:', err);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error during SA4 data import:', err);
  }
}

// Run the import function
importSA4Data().catch(err => {
  console.error('Import failed:', err);
}); 