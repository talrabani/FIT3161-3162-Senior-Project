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
 * API endpoint to get DAY rainfall data for a specific station on a given date
 * GET /api/rainfall/station/:station_id/date/:date
 */
router.get('/station/:station_id/date/:date', async (req, res) => {
  const { station_id, date } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT station_id, date, rainfall, max_temp, min_temp FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND date = $2
    `, [station_id, date]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rainfall data:', error);
    res.status(500).json({ error: 'Failed to fetch rainfall data' });
  }
});

/**
 * API endpoint to get DAILTY rainfall data for a specific station for a range of dates
 * GET /api/rainfall/station/:station_id/date/:start_date/end_date/:end_date
 */
router.get('/station/:station_id/date/:start_date/end_date/:end_date', async (req, res) => {
  const { station_id, start_date, end_date } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT station_id, date, rainfall, max_temp, min_temp FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND date BETWEEN $2 AND $3
    `, [station_id, start_date, end_date]);
  
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rainfall data:', error);
    res.status(500).json({ error: 'Failed to fetch rainfall data' });
  }
});

/**
 * API endpoint to get the average rainfall for all SA4 areas on a given month, year
 * GET /api/rainfall/sa4/month/:month/year/:year
 */
router.get('/sa4/month/:month/year/:year', async (req, res) => {
  const { month, year } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT sa4_code, year, month, rainfall, max_temp, min_temp FROM SA4_RAINFALL_MONTHLY 
      WHERE month = $1
      AND year = $2
      `, [month, year]);

    res.json(result.rows);  
  } catch (error) {
    console.error('Error fetching rainfall data:', error);
    res.status(500).json({ error: 'Failed to fetch rainfall data' });
  }
});

/**
 * API endpoint to get the average rainfall for all SA4 areas on a given year.
 * This is done by averaging the monthy averages by year
 * GET /api/rainfall/sa4/year/:year
 */
router.get('/sa4/year/:year', async (req, res) => {
  const { year } = req.params;

  try {
    const result = await pool.query(`
      SELECT sa4_code, year, avg(rainfall) as rainfall, avg(max_temp) as max_temp, avg(min_temp) as min_temp FROM SA4_RAINFALL_MONTHLY 
      WHERE year = $1
      GROUP BY sa4_code, year
    `, [year]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching yearly rainfall data:', error);
    res.status(500).json({ error: 'Failed to fetch yearly rainfall data' });
  }
});

module.exports = router;

