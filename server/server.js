const express = require('express');
const cors = require("cors");
const app = express();

require('dotenv').config()

app.use(express.json());
app.use(cors());

// Import routes
const boundariesRoutes = require('./routes/boundaries');

// Use routes
app.use('/api/boundaries', boundariesRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Weather App API is running' });
});

app.listen(8080, () => {
  console.log("Server started on port 8080");
})

