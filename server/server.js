const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const apiRoutes = require('./apiRoutes');
const { initializeMongoDB, getConnectionState } = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static folder for uploaded photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  console.error('Stack trace:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Variable to store MongoDB connection status
let isDbConnected = false;

// Start server and initialize MongoDB connection
const startServer = async () => {
  try {
    const dbConnection = await initializeMongoDB();
    if (dbConnection) {
      isDbConnected = true;
      console.log('MongoDB connection initialized successfully');
    } else {
      console.warn('Server starting without MongoDB connection. Some features may be unavailable.');
      isDbConnected = false;
    }

    // Start the Express server regardless of DB connection status
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server due to unexpected error:', err.message);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  }
};

startServer();

// Add a health check endpoint to verify server and DB status
app.get('/api/health', async (req, res) => {
  try {
    const dbState = getConnectionState();
    const isConnected = dbState === 'connected';
    res.status(isConnected ? 200 : 503).json({
      status: isConnected ? 'ok' : 'error',
      database: dbState,
      message: isConnected ? 'Database is connected' : 'Database connection failed'
    });
  } catch (error) {
    console.error('Health check error:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: 'Service unavailable'
    });
  }
});

// Middleware to check DB connection before processing API requests
app.use('/api', (req, res, next) => {
  if (getConnectionState() !== 'connected') {
    console.warn(`API request received while DB is not connected. State: ${getConnectionState()}`);
    return res.status(503).json({
      status: 'error',
      message: 'Service temporarily unavailable due to database connection issues'
    });
  }
  next();
});
