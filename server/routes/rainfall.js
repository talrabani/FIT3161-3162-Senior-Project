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
 * API endpoint to get Monthly rainfall data for a specific station on a given month, year
 * GET /api/rainfall/station/:station_id/month/:month/year/:year
 */
router.get('/station/:station_id/month/:month/year/:year', async (req, res) => {
  const { station_id, month, year } = req.params;

  try {
    // Query for average values
    const avgResult = await pool.query(`
      SELECT 
        station_id, 
        EXTRACT(MONTH FROM date) as month, 
        EXTRACT(YEAR FROM date) as year, 
        avg(rainfall) as rainfall, 
        avg(max_temp) as max_temp, 
        avg(min_temp) as min_temp,
        sum(rainfall) as total_rainfall
      FROM RAINFALL_DATA_DAILY   
      WHERE station_id = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND EXTRACT(YEAR FROM date) = $3
      GROUP BY station_id, EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)
    `, [station_id, month, year]);
    
    // Query for highest temperature
    const highestTempResult = await pool.query(`
      SELECT 
        date, 
        max_temp
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND EXTRACT(YEAR FROM date) = $3
      AND max_temp IS NOT NULL
      ORDER BY max_temp DESC
      LIMIT 1
    `, [station_id, month, year]);
    
    // Query for lowest temperature
    const lowestTempResult = await pool.query(`
      SELECT 
        date, 
        min_temp
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND EXTRACT(YEAR FROM date) = $3
      AND min_temp IS NOT NULL
      ORDER BY min_temp ASC
      LIMIT 1
    `, [station_id, month, year]);
    
    // Query for highest rainfall day
    const highestRainfallResult = await pool.query(`
      SELECT 
        date, 
        rainfall
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND EXTRACT(YEAR FROM date) = $3
      AND rainfall IS NOT NULL AND rainfall > 0
      ORDER BY rainfall DESC
      LIMIT 1
    `, [station_id, month, year]);
    
    // ADDITIONAL STATISTICS - Precipitation Related
    
    // Number of Rainy Days
    const rainyDaysResult = await pool.query(`
      SELECT 
        COUNT(*) as rainy_days
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND EXTRACT(YEAR FROM date) = $3
      AND rainfall IS NOT NULL AND rainfall > 0
    `, [station_id, month, year]);
    
    // Precipitation Intensity (average rainfall per rainy day)
    const rainfallIntensityResult = await pool.query(`
      SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE SUM(rainfall) / COUNT(*)
        END as rainfall_intensity
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND EXTRACT(YEAR FROM date) = $3
      AND rainfall IS NOT NULL AND rainfall > 0
    `, [station_id, month, year]);
    
    // Precipitation Variability (standard deviation)
    const rainfallVariabilityResult = await pool.query(`
      SELECT 
        STDDEV(rainfall) as rainfall_variability
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND EXTRACT(YEAR FROM date) = $3
      AND rainfall IS NOT NULL
    `, [station_id, month, year]);
    
    // Consecutive Rainy Days calculation requires more complex query
    // We'll retrieve all the daily data for the month and calculate client-side
    const dailyDataResult = await pool.query(`
      SELECT 
        date,
        rainfall
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND EXTRACT(YEAR FROM date) = $3
      ORDER BY date ASC
    `, [station_id, month, year]);
    
    // Calculate consecutive rainy and dry days
    let maxConsecutiveRainyDays = 0;
    let maxConsecutiveDryDays = 0;
    let currentRainyStreak = 0;
    let currentDryStreak = 0;
    
    dailyDataResult.rows.forEach(day => {
      if (day.rainfall > 0) {
        // Rainy day
        currentRainyStreak++;
        currentDryStreak = 0;
        maxConsecutiveRainyDays = Math.max(maxConsecutiveRainyDays, currentRainyStreak);
      } else {
        // Dry day
        currentDryStreak++;
        currentRainyStreak = 0;
        maxConsecutiveDryDays = Math.max(maxConsecutiveDryDays, currentDryStreak);
      }
    });
    
    // ADDITIONAL STATISTICS - Temperature Related
    
    // Average Daily Temperature Range
    const tempRangeResult = await pool.query(`
      SELECT 
        AVG(max_temp - min_temp) as avg_daily_temp_range
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND EXTRACT(YEAR FROM date) = $3
      AND max_temp IS NOT NULL AND min_temp IS NOT NULL
    `, [station_id, month, year]);
    
    // Temperature Variability (standard deviation of daily mean temps)
    const tempVariabilityResult = await pool.query(`
      SELECT 
        STDDEV((max_temp + min_temp)/2) as temp_variability
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND EXTRACT(YEAR FROM date) = $3
      AND max_temp IS NOT NULL AND min_temp IS NOT NULL
    `, [station_id, month, year]);
    
    // Days Above/Below Temperature Thresholds
    const tempThresholdsResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN max_temp > 30 THEN 1 ELSE 0 END) as days_above_30,
        SUM(CASE WHEN min_temp < 0 THEN 1 ELSE 0 END) as days_below_0
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND EXTRACT(YEAR FROM date) = $3
      AND max_temp IS NOT NULL AND min_temp IS NOT NULL
    `, [station_id, month, year]);
    
    // Combine all results into a single response object
    const baseData = avgResult.rows.length > 0 ? avgResult.rows[0] : {
      station_id,
      month,
      year,
      rainfall: null,
      max_temp: null,
      min_temp: null,
      total_rainfall: null
    };
    
    const response = {
      ...baseData,
      highest_temp: highestTempResult.rows.length > 0 ? {
        date: highestTempResult.rows[0].date,
        value: highestTempResult.rows[0].max_temp
      } : null,
      lowest_temp: lowestTempResult.rows.length > 0 ? {
        date: lowestTempResult.rows[0].date,
        value: lowestTempResult.rows[0].min_temp
      } : null,
      highest_rainfall_day: highestRainfallResult.rows.length > 0 ? {
        date: highestRainfallResult.rows[0].date,
        value: highestRainfallResult.rows[0].rainfall
      } : null,
      // Additional precipitation stats
      precipitation_stats: {
        rainy_days: rainyDaysResult.rows.length > 0 ? Number(rainyDaysResult.rows[0].rainy_days) : 0,
        max_consecutive_rainy_days: maxConsecutiveRainyDays,
        max_consecutive_dry_days: maxConsecutiveDryDays,
        rainfall_intensity: rainfallIntensityResult.rows.length > 0 ? 
          Number(rainfallIntensityResult.rows[0].rainfall_intensity) : null,
        rainfall_variability: rainfallVariabilityResult.rows.length > 0 ? 
          Number(rainfallVariabilityResult.rows[0].rainfall_variability) : null
      },
      // Additional temperature stats
      temperature_stats: {
        avg_daily_temp_range: tempRangeResult.rows.length > 0 ? 
          Number(tempRangeResult.rows[0].avg_daily_temp_range) : null,
        temp_variability: tempVariabilityResult.rows.length > 0 ? 
          Number(tempVariabilityResult.rows[0].temp_variability) : null,
        days_above_30c: tempThresholdsResult.rows.length > 0 ? 
          Number(tempThresholdsResult.rows[0].days_above_30) : 0,
        days_below_0c: tempThresholdsResult.rows.length > 0 ? 
          Number(tempThresholdsResult.rows[0].days_below_0) : 0
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching monthly rainfall data:', error);
    res.status(500).json({ error: 'Failed to fetch monthly rainfall data' });
  }
});

/**
 * API endpoint to get Yearly rainfall data for a specific station on a given year
 * GET /api/rainfall/station/:station_id/year/:year
 */
router.get('/station/:station_id/year/:year', async (req, res) => {
  const { station_id, year } = req.params;

  try {
    // Query for average values
    const avgResult = await pool.query(`
      SELECT 
        station_id, 
        EXTRACT(YEAR FROM date) as year, 
        avg(rainfall) as rainfall, 
        avg(max_temp) as max_temp, 
        avg(min_temp) as min_temp,
        sum(rainfall) as total_rainfall
      FROM RAINFALL_DATA_DAILY   
      WHERE station_id = $1 
      AND EXTRACT(YEAR FROM date) = $2
      GROUP BY station_id, EXTRACT(YEAR FROM date)
    `, [station_id, year]);
    
    // Query for highest temperature
    const highestTempResult = await pool.query(`
      SELECT 
        date, 
        max_temp
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(YEAR FROM date) = $2
      AND max_temp IS NOT NULL
      ORDER BY max_temp DESC
      LIMIT 1
    `, [station_id, year]);
    
    // Query for lowest temperature
    const lowestTempResult = await pool.query(`
      SELECT 
        date, 
        min_temp
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(YEAR FROM date) = $2
      AND min_temp IS NOT NULL
      ORDER BY min_temp ASC
      LIMIT 1
    `, [station_id, year]);
    
    // Query for highest rainfall day
    const highestRainfallResult = await pool.query(`
      SELECT 
        date, 
        rainfall
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(YEAR FROM date) = $2
      AND rainfall IS NOT NULL AND rainfall > 0
      ORDER BY rainfall DESC
      LIMIT 1
    `, [station_id, year]);
    
    // ADDITIONAL STATISTICS - Precipitation Related
    
    // Number of Rainy Days
    const rainyDaysResult = await pool.query(`
      SELECT 
        COUNT(*) as rainy_days
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(YEAR FROM date) = $2
      AND rainfall IS NOT NULL AND rainfall > 0
    `, [station_id, year]);
    
    // Precipitation Intensity (average rainfall per rainy day)
    const rainfallIntensityResult = await pool.query(`
      SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE SUM(rainfall) / COUNT(*)
        END as rainfall_intensity
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(YEAR FROM date) = $2
      AND rainfall IS NOT NULL AND rainfall > 0
    `, [station_id, year]);
    
    // Precipitation Variability (standard deviation)
    const rainfallVariabilityResult = await pool.query(`
      SELECT 
        STDDEV(rainfall) as rainfall_variability
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(YEAR FROM date) = $2
      AND rainfall IS NOT NULL
    `, [station_id, year]);
    
    // Consecutive Rainy Days calculation 
    // For yearly data, we'll calculate max consecutive days by month and take the max
    // First, get all daily data
    const dailyDataResult = await pool.query(`
      SELECT 
        date,
        rainfall
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(YEAR FROM date) = $2
      ORDER BY date ASC
    `, [station_id, year]);
    
    // Calculate consecutive rainy and dry days
    let maxConsecutiveRainyDays = 0;
    let maxConsecutiveDryDays = 0;
    let currentRainyStreak = 0;
    let currentDryStreak = 0;
    
    dailyDataResult.rows.forEach(day => {
      if (day.rainfall > 0) {
        // Rainy day
        currentRainyStreak++;
        currentDryStreak = 0;
        maxConsecutiveRainyDays = Math.max(maxConsecutiveRainyDays, currentRainyStreak);
      } else {
        // Dry day
        currentDryStreak++;
        currentRainyStreak = 0;
        maxConsecutiveDryDays = Math.max(maxConsecutiveDryDays, currentDryStreak);
      }
    });
    
    // ADDITIONAL STATISTICS - Temperature Related
    
    // Average Daily Temperature Range
    const tempRangeResult = await pool.query(`
      SELECT 
        AVG(max_temp - min_temp) as avg_daily_temp_range
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(YEAR FROM date) = $2
      AND max_temp IS NOT NULL AND min_temp IS NOT NULL
    `, [station_id, year]);
    
    // Temperature Variability (standard deviation of daily mean temps)
    const tempVariabilityResult = await pool.query(`
      SELECT 
        STDDEV((max_temp + min_temp)/2) as temp_variability
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(YEAR FROM date) = $2
      AND max_temp IS NOT NULL AND min_temp IS NOT NULL
    `, [station_id, year]);
    
    // Days Above/Below Temperature Thresholds
    const tempThresholdsResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN max_temp > 30 THEN 1 ELSE 0 END) as days_above_30,
        SUM(CASE WHEN min_temp < 0 THEN 1 ELSE 0 END) as days_below_0
      FROM RAINFALL_DATA_DAILY 
      WHERE station_id = $1 
      AND EXTRACT(YEAR FROM date) = $2
      AND max_temp IS NOT NULL AND min_temp IS NOT NULL
    `, [station_id, year]);
    
    // Combine all results into a single response object
    const baseData = avgResult.rows.length > 0 ? avgResult.rows[0] : {
      station_id,
      year,
      rainfall: null,
      max_temp: null,
      min_temp: null,
      total_rainfall: null
    };
    
    const response = {
      ...baseData,
      highest_temp: highestTempResult.rows.length > 0 ? {
        date: highestTempResult.rows[0].date,
        value: highestTempResult.rows[0].max_temp
      } : null,
      lowest_temp: lowestTempResult.rows.length > 0 ? {
        date: lowestTempResult.rows[0].date,
        value: lowestTempResult.rows[0].min_temp
      } : null,
      highest_rainfall_day: highestRainfallResult.rows.length > 0 ? {
        date: highestRainfallResult.rows[0].date,
        value: highestRainfallResult.rows[0].rainfall
      } : null,
      // Additional precipitation stats
      precipitation_stats: {
        rainy_days: rainyDaysResult.rows.length > 0 ? Number(rainyDaysResult.rows[0].rainy_days) : 0,
        max_consecutive_rainy_days: maxConsecutiveRainyDays,
        max_consecutive_dry_days: maxConsecutiveDryDays,
        rainfall_intensity: rainfallIntensityResult.rows.length > 0 ? 
          Number(rainfallIntensityResult.rows[0].rainfall_intensity) : null,
        rainfall_variability: rainfallVariabilityResult.rows.length > 0 ? 
          Number(rainfallVariabilityResult.rows[0].rainfall_variability) : null
      },
      // Additional temperature stats
      temperature_stats: {
        avg_daily_temp_range: tempRangeResult.rows.length > 0 ? 
          Number(tempRangeResult.rows[0].avg_daily_temp_range) : null,
        temp_variability: tempVariabilityResult.rows.length > 0 ? 
          Number(tempVariabilityResult.rows[0].temp_variability) : null,
        days_above_30c: tempThresholdsResult.rows.length > 0 ? 
          Number(tempThresholdsResult.rows[0].days_above_30) : 0,
        days_below_0c: tempThresholdsResult.rows.length > 0 ? 
          Number(tempThresholdsResult.rows[0].days_below_0) : 0
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching yearly rainfall data:', error);
    res.status(500).json({ error: 'Failed to fetch yearly rainfall data' });
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
 * API endpoint to get AGGREGATED (monthly or yearly) rainfall data for a specific station 
 * for a range of dates.
 * GET /api/rainfall/aggregated/station/:station_id/frequency/:frequency/date/:start_date/end_date/:end_date
 * @param {string} station_id - The ID of the weather station
 * @param {string} frequency - Either 'monthly' or 'yearly'
 * @param {string} start_date - Start date in YYYY-MM-DD format
 * @param {string} end_date - End date in YYYY-MM-DD format
 * @returns {Array} - Array of aggregated data points
 */
router.get('/aggregated/station/:station_id/frequency/:frequency/date/:start_date/end_date/:end_date', async (req, res) => {
  const { station_id, frequency, start_date, end_date } = req.params;
  const data_type = req.query.data_type || 'rainfall'; // Default to rainfall if not specified
  
  // Validate frequency parameter
  if (frequency !== 'monthly' && frequency !== 'yearly') {
    return res.status(400).json({ error: 'Frequency must be either "monthly" or "yearly"' });
  }
  
  // Validate data_type parameter
  if (!['rainfall', 'max_temp', 'min_temp'].includes(data_type)) {
    return res.status(400).json({ error: 'Data type must be one of "rainfall", "max_temp", or "min_temp"' });
  }
  
  try {
    let query;
    
    if (frequency === 'monthly') {
      // Monthly aggregation
      query = `
        SELECT 
          station_id,
          TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM-DD') as date,
          EXTRACT(YEAR FROM date) as year,
          EXTRACT(MONTH FROM date) as month,
          AVG(rainfall) as rainfall,
          AVG(max_temp) as max_temp,
          AVG(min_temp) as min_temp,
          COUNT(*) as days_count
        FROM RAINFALL_DATA_DAILY
        WHERE station_id = $1
        AND date BETWEEN $2 AND $3
        GROUP BY station_id, DATE_TRUNC('month', date), 
                 EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
        ORDER BY date
      `;
    } else {
      // Yearly aggregation
      query = `
        SELECT 
          station_id,
          TO_CHAR(DATE_TRUNC('year', date), 'YYYY-MM-DD') as date,
          EXTRACT(YEAR FROM date) as year,
          AVG(rainfall) as rainfall,
          AVG(max_temp) as max_temp,
          AVG(min_temp) as min_temp,
          COUNT(*) as days_count
        FROM RAINFALL_DATA_DAILY
        WHERE station_id = $1
        AND date BETWEEN $2 AND $3
        GROUP BY station_id, DATE_TRUNC('year', date), EXTRACT(YEAR FROM date)
        ORDER BY date
      `;
    }
    
    const result = await pool.query(query, [station_id, start_date, end_date]);
    
    // Format the data to ensure consistent structure with daily data
    const formattedData = result.rows.map(row => ({
      station_id: row.station_id,
      date: row.date,
      rainfall: parseFloat(row.rainfall),
      max_temp: parseFloat(row.max_temp),
      min_temp: parseFloat(row.min_temp),
      // Include metadata
      aggregation: {
        frequency: frequency,
        year: parseInt(row.year),
        month: frequency === 'monthly' ? parseInt(row.month) : null,
        days_count: parseInt(row.days_count)
      }
    }));
    
    res.json(formattedData);
  } catch (error) {
    console.error(`Error fetching ${frequency} aggregated rainfall data:`, error);
    res.status(500).json({ error: `Failed to fetch ${frequency} aggregated rainfall data` });
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

