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
 * GET /api/stations/search
 * Search for stations by name, id, or state
 * Query parameters:
 *  - query: The search term
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.json([]);
    }
    
    console.log('Searching for stations with query:', query);
    const client = await pool.connect();
    
    try {
      // Check if the query could be a numeric station ID
      const isNumeric = /^\d+$/.test(query.trim());
      let result;
      
      if (isNumeric) {
        // If numeric, try exact match on station_id first
        const exactIdResult = await client.query(`
          SELECT 
            station_id,
            station_name,
            ST_AsGeoJSON(station_location)::json as location,
            station_height,
            station_state,
            station_start_year,
            station_end_year,
            sa4_code
          FROM 
            STATION
          WHERE 
            station_id = $1
          LIMIT 1
        `, [query.trim()]);
        
        // If we found an exact match, return it
        if (exactIdResult.rows.length > 0) {
          console.log(`Found exact match for station ID: ${query}`);
          return res.json(exactIdResult.rows);
        }
      }
      
      // Otherwise, proceed with fuzzy search
      result = await client.query(`
        SELECT 
          station_id,
          station_name,
          ST_AsGeoJSON(station_location)::json as location,
          station_height,
          station_state,
          station_start_year,
          station_end_year,
          sa4_code
        FROM 
          STATION
        WHERE 
          station_name ILIKE $1
          OR station_id::text ILIKE $1
          OR station_state ILIKE $1
        ORDER BY 
          CASE 
            WHEN station_id::text = $2 THEN 0 -- Exact ID match first
            WHEN station_name ILIKE $3 THEN 1 -- Exact name match second
            ELSE 2 -- Partial matches last
          END,
          station_name
        LIMIT 10
      `, [`%${query}%`, query.trim(), `${query.trim()}`]);
      
      console.log(`Found ${result.rows.length} stations matching "${query}"`);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error searching for stations:', err);
    res.status(500).json({ error: 'Failed to search for stations' });
  }
});

/**
 * GET /api/stations/:id
 * Get details for a specific station by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          station_id,
          station_name,
          ST_AsGeoJSON(station_location)::json as location,
          station_height,
          station_state,
          station_start_year,
          station_end_year,
          sa4_code
        FROM 
          STATION
        WHERE 
          station_id = $1
      `, [id]);
      
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'Station not found' });
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching station:', err);
    res.status(500).json({ error: 'Failed to fetch station' });
  }
});

module.exports = router; 