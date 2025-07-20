const mongoose = require('mongoose');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost/photo_rating';

// Create connection with proper error handling
const mongoDb = mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s if server is not found
  autoReconnect: true, // Automatically attempt to reconnect
  reconnectTries: Number.MAX_VALUE, // Retry indefinitely
  reconnectInterval: 1000, // Wait 1s between retries
})
  .then(() => {
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    throw err;
  });

module.exports = {
  mongoDb,
};
