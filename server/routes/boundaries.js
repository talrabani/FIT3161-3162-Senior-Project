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
        res.json(result.rows[0].geojson);
      } else {
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

module.exports = router; 