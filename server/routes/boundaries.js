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
 * GET /api/boundaries/sa4
 * Returns all SA4 boundaries as GeoJSON
 */
router.get('/sa4', async (req, res) => {
  try {
    console.log('Fetching SA4 boundaries...');
    const client = await pool.connect();
    
    try {
      // Query to get all SA4 boundaries as GeoJSON
      const result = await client.query(`
        SELECT json_build_object(
          'type', 'FeatureCollection',
          'features', json_agg(
            json_build_object(
              'type', 'Feature',
              'id', sa4_code21,
              'geometry', ST_AsGeoJSON(geometry)::json,
              'properties', json_build_object(
                'code', sa4_code21,
                'name', sa4_name21,
                'state', ste_name21,
                'area_sqkm', areasqkm21
              )
            )
          )
        ) AS geojson
        FROM SA4_BOUNDARIES;
      `);
      
      // Send the GeoJSON response
      if (result.rows.length > 0 && result.rows[0].geojson) {
        console.log('Successfully retrieved SA4 boundaries');
        res.json(result.rows[0].geojson);
      } else {
        console.log('No SA4 boundaries found in database');
        res.json({ type: 'FeatureCollection', features: [] });
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching SA4 boundaries:', err);
    res.status(500).json({ error: 'Failed to fetch SA4 boundaries' });
  }
});

/**
 * GET /api/boundaries/sa4/:code
 * Returns a specific SA4 boundary by code
 */
router.get('/sa4/:code', async (req, res) => {
  try {
    const client = await pool.connect();
    const { code } = req.params;
    
    try {
      // Query to get a specific SA4 boundary as GeoJSON
      const result = await client.query(`
        SELECT json_build_object(
          'type', 'Feature',
          'id', sa4_code21,
          'geometry', ST_AsGeoJSON(geometry)::json,
          'properties', json_build_object(
            'code', sa4_code21,
            'name', sa4_name21,
            'state', ste_name21,
            'area_sqkm', areasqkm21
          )
        ) AS geojson
        FROM SA4_BOUNDARIES
        WHERE sa4_code21 = $1;
      `, [code]);
      
      if (result.rows.length > 0 && result.rows[0].geojson) {
        res.json(result.rows[0].geojson);
      } else {
        res.status(404).json({ error: 'SA4 boundary not found' });
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching SA4 boundary:', err);
    res.status(500).json({ error: 'Failed to fetch SA4 boundary' });
  }
});

/**
 * GET /api/boundaries/sa4/:code/stations
 * Returns all stations that belong to a specific SA4 boundary
 * Optional query parameter:
 *  - date: Filter stations that have data available for the provided date (YYYY-MM-DD)
 */
router.get('/sa4/:code/stations', async (req, res) => {
  try {
    const client = await pool.connect();
    const { code } = req.params;
    const { date } = req.query;
    
    try {
      // Build the query based on whether we have a date filter
      let query = `
        SELECT 
          s.station_id,
          s.station_name,
          ST_AsGeoJSON(s.station_location)::json as location,
          s.station_height,
          s.station_state,
          s.station_start_year,
          s.station_end_year,
          b.sa4_name21 as sa4_name
        FROM 
          STATION s
        JOIN 
          SA4_BOUNDARIES b ON s.sa4_code = b.sa4_code21
        WHERE 
          s.sa4_code = $1
      `;

      const params = [code];

      // Add date filtering if date parameter is provided
      if (date) {
        // Extract the year from the provided date
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();

        // Add condition to filter by year range
        query += ` 
          AND (
            (s.station_start_year IS NOT NULL AND s.station_start_year <= $2)
            AND
            (s.station_end_year IS NULL OR s.station_end_year >= $2)
          )
        `;
        params.push(year);
      }

      // Add the ordering
      query += ' ORDER BY s.station_name';
      
      const result = await client.query(query, params);
      
      if (result.rows.length > 0) {
        res.json(result.rows);
      } else {
        res.json([]);
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching stations for SA4 boundary:', err);
    res.status(500).json({ error: 'Failed to fetch stations for SA4 boundary' });
  }
});

/**
 * GET /api/boundaries/sa4-summary
 * Returns a summary of how many stations are in each SA4 boundary
 */
router.get('/sa4-summary', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      // Query to get station count by SA4 boundary
      const result = await client.query(`
        SELECT 
          b.sa4_code21 as code,
          b.sa4_name21 as name,
          b.ste_name21 as state,
          COUNT(s.station_id) as station_count
        FROM 
          SA4_BOUNDARIES b
        LEFT JOIN 
          STATION s ON b.sa4_code21 = s.sa4_code
        GROUP BY 
          b.sa4_code21, b.sa4_name21, b.ste_name21
        ORDER BY 
          station_count DESC, name;
      `);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching SA4 summary:', err);
    res.status(500).json({ error: 'Failed to fetch SA4 summary' });
  }
});

module.exports = router; 