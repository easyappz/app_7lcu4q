const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const apiRoutes = require('./apiRoutes');
const { mongoDb } = require('./db');

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
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Start server regardless of MongoDB connection status
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Check MongoDB connection status
mongoDb
  .then(() => {
    console.log('MongoDB connection established');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  });

// Add a health check endpoint to verify server and DB status
app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoDb.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
      status: 'ok',
      database: dbState,
      message: dbState === 'connected' ? 'Database is connected' : 'Database connection failed'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: 'Service unavailable'
    });
  }
});
