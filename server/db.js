const mongoose = require('mongoose');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost/photo_rating';

// Create connection with enhanced error handling and reconnection logic
const mongoDb = mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s if server is not found
  autoReconnect: true, // Automatically attempt to reconnect
  reconnectTries: Number.MAX_VALUE, // Retry indefinitely
  reconnectInterval: 1000, // Wait 1s between retries
  bufferCommands: false, // Disable command buffering when disconnected
  autoIndex: false // Disable automatic index builds in production for performance
})
  .then(() => {
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  })
  .catch((err) => {
    console.error('MongoDB initial connection error:', err.message);
    return mongoose.connection;
  });

// Monitor connection events for better debugging
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

// Handle process termination to close DB connection gracefully
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = {
  mongoDb,
};
