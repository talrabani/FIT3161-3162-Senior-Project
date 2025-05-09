const express = require('express');
const cors = require("cors");
const app = express();

require('dotenv').config()

// Import routes
const boundariesRoutes = require('./routes/boundaries');
const rainfallRoutes = require('./routes/rainfall');
const authRoutes = require('./routes/auth');
const stationsRoutes = require('./routes/stations');

// Configure CORS
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(express.json());
app.use(cors(corsOptions));

// Register routes
app.use('/api/boundaries', boundariesRoutes);
app.use('/api/rainfall', rainfallRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/stations', stationsRoutes);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running properly' });
});

app.listen(8080, () => {
  console.log("Server started on port 8080");
})

