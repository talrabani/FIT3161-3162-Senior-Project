// This route returns the rainfall data for all stations in an area on a given date

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'weather_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

/**
 * GET /api/rainfall/sa4/:code
 * Returns rainfall data for all stations in a specific SA4 area
 * Query parameters:
 *  - date: The date to get rainfall data for (YYYY-MM-DD)
 *  - start_date: Optional start date for a date range (YYYY-MM-DD)
 *  - end_date: Optional end date for a date range (YYYY-MM-DD)
 */
router.get('/sa4/:code', async (req, res) => {
  try {
    const client = await pool.connect();
    const { code } = req.params;
    const { date, start_date, end_date } = req.query;
    
    // Validate inputs
    if (!code) {
      return res.status(400).json({ error: 'SA4 code is required' });
    }
    
    // Check if we have a single date or a date range
    const isSingleDate = date && !start_date && !end_date;
    const isDateRange = !date && start_date && end_date;
    
    if (!isSingleDate && !isDateRange) {
      return res.status(400).json({ 
        error: 'Either date or both start_date and end_date must be provided' 
      });
    }
    
    // Build the appropriate query based on date parameters
    let query;
    let params = [code];
    
    if (isSingleDate) {
      // Query for a single date
      query = `
        SELECT 
          s.station_id,
          s.station_name,
          ST_AsGeoJSON(s.station_location)::json as location,
          r.reading_date,
          r.rainfall_amount
        FROM 
          STATION s
        JOIN 
          RAINFALL_READING r ON s.station_id = r.station_id
        WHERE 
          s.sa4_code = $1 AND
          r.reading_date = $2
        ORDER BY 
          s.station_name, r.reading_date;
      `;
      params.push(date);
    } else {
      // Query for a date range
      query = `
        SELECT 
          s.station_id,
          s.station_name,
          ST_AsGeoJSON(s.station_location)::json as location,
          r.reading_date,
          r.rainfall_amount
        FROM 
          STATION s
        JOIN 
          RAINFALL_READING r ON s.station_id = r.station_id
        WHERE 
          s.sa4_code = $1 AND
          r.reading_date BETWEEN $2 AND $3
        ORDER BY 
          s.station_name, r.reading_date;
      `;
      params.push(start_date, end_date);
    }
    
    try {
      const result = await client.query(query, params);
      
      // Process results to group by station
      const stationMap = {};
      
      result.rows.forEach(row => {
        if (!stationMap[row.station_id]) {
          stationMap[row.station_id] = {
            station_id: row.station_id,
            station_name: row.station_name,
            location: row.location,
            rainfall_data: []
          };
        }
        
        stationMap[row.station_id].rainfall_data.push({
          date: row.reading_date,
          amount: row.rainfall_amount
        });
      });
      
      // Convert the map to an array
      const responseData = Object.values(stationMap);
      
      res.json(responseData);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching rainfall data for SA4 area:', err);
    res.status(500).json({ error: 'Failed to fetch rainfall data' });
  }
});

module.exports = router;

