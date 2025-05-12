const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'weather_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Signup route
router.post('/signup', async (req, res) => {
  const { username, password, email, units = 'metric' } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Username, password, and email are required' });
  }

  try {
    // Check if user already exists (by username or email)
    const userExists = await pool.query(
      'SELECT * FROM "USER" WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userExists.rows.length > 0) {
      const existingUser = userExists.rows[0];
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user with email and units
    await pool.query(
      'INSERT INTO "USER" (username, password, email, units) VALUES ($1, $2, $3, $4) RETURNING user_id',
      [username, hashedPassword, email, units]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Login route - now using email instead of username
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find user by email instead of username
    const result = await pool.query(
      'SELECT * FROM "USER" WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.user_id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        units: user.units
      }
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Get user information route
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(
      'SELECT user_id, username, email, units FROM "USER" WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    res.json({
      id: user.user_id,
      username: user.username,
      email: user.email,
      units: user.units
    });
  } catch (err) {
    console.error('Error fetching user information:', err);
    res.status(500).json({ message: 'Error fetching user information' });
  }
});

// Update user preferences route
router.put('/user/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { units, displayName } = req.body;
    
    let query = 'UPDATE "USER" SET ';
    const params = [];
    const updateFields = [];
    
    if (units !== undefined) {
      params.push(units);
      updateFields.push(`units = $${params.length}`);
    }
    
    if (displayName !== undefined) {
      params.push(displayName);
      updateFields.push(`username = $${params.length}`);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    query += updateFields.join(', ');
    params.push(userId);
    query += ` WHERE user_id = $${params.length} RETURNING user_id, username, email, units`;
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    res.json({
      id: user.user_id,
      username: user.username,
      email: user.email,
      units: user.units,
      message: 'User preferences updated successfully'
    });
  } catch (err) {
    console.error('Error updating user preferences:', err);
    res.status(500).json({ message: 'Error updating user preferences' });
  }
});

module.exports = router; 