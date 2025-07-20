const mongoose = require('mongoose');

// MongoDB connection URI from environment variables
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost/photo_rating';

// Function to initialize MongoDB connection with detailed error handling
const initializeMongoDB = async () => {
  try {
    const connection = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if server is not found
      autoReconnect: true, // Automatically attempt to reconnect
      reconnectTries: Number.MAX_VALUE, // Retry indefinitely
      reconnectInterval: 1000, // Wait 1s between retries
      bufferCommands: false, // Disable command buffering when disconnected
      autoIndex: false // Disable automatic index builds in production for performance
    });
    console.log('MongoDB connected successfully');
    return connection;
  } catch (err) {
    console.error('MongoDB initial connection error:', err.message);
    console.error('Stack trace:', err.stack);
    // Return null to indicate failed connection, allowing server to handle this case
    return null;
  }
};

// Monitor connection events for better debugging and diagnostics
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
  console.error('Stack trace:', err.stack);
});

// Handle process termination to close DB connection gracefully
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection on termination:', err.message);
    process.exit(1);
  }
});

// Function to check the current state of the MongoDB connection
const getConnectionState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = {
  initializeMongoDB,
  getConnectionState
};
