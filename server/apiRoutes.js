const express = require('express');
const router = express.Router();
const User = require('./models/User');
const Photo = require('./models/Photo');
const Rating = require('./models/Rating');
const { hashPassword, comparePassword, generateToken } = require('./utils/auth');
const authMiddleware = require('./middleware/auth');
const uploadMiddleware = require('./middleware/upload');
const { ensureConnection } = require('./db');

// Middleware to check database connection before processing requests
const checkDbConnection = async (req, res, next) => {
  const isConnected = await ensureConnection();
  if (!isConnected) {
    console.error('Database connection unavailable for request:', req.originalUrl);
    return res.status(503).json({ message: 'Service temporarily unavailable due to database connection issues' });
  }
  next();
};

// GET /api/hello
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from API!' });
});

// GET /api/status
router.get('/status', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// POST /api/register - User registration
router.post('/register', checkDbConnection, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email }).catch(err => {
      console.error('Database error during user check:', err.message, err.stack);
      throw new Error('Database operation failed during user check');
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password).catch(err => {
      console.error('Error hashing password:', err.message, err.stack);
      throw new Error('Password hashing failed');
    });
    const user = new User({ email, password: hashedPassword });
    await user.save().catch(err => {
      console.error('Database error during user save:', err.message, err.stack);
      throw new Error('Database operation failed during user save');
    });

    const token = generateToken(user._id);
    console.log('User registered successfully:', email);
    res.status(201).json({ token, user: { id: user._id, email: user.email, points: user.points } });
  } catch (error) {
    console.error('Registration error for email:', req.body.email || 'unknown', error.message, error.stack);
    res.status(500).json({ message: 'Registration failed due to server error', error: error.message });
  }
});

// POST /api/login - User login
router.post('/login', checkDbConnection, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('Login failed: Missing email or password for request from:', req.ip);
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Login attempt for email:', email, 'from IP:', req.ip);
    const user = await User.findOne({ email }).catch(err => {
      console.error('Database error during user lookup for email:', email, err.message, err.stack);
      throw new Error('Database operation failed during user lookup');
    });
    if (!user) {
      console.log('User not found for email:', email, 'from IP:', req.ip);
      return res.status(400).json({ message: 'Invalid credentials: User not found' });
    }

    console.log('User found, comparing passwords for:', email);
    const isMatch = await comparePassword(password, user.password).catch(err => {
      console.error('Error comparing passwords for email:', email, err.message, err.stack);
      throw new Error('Password comparison failed');
    });
    if (!isMatch) {
      console.log('Password mismatch for email:', email, 'from IP:', req.ip);
      return res.status(400).json({ message: 'Invalid credentials: Password mismatch' });
    }

    console.log('Login successful for:', email, 'from IP:', req.ip);
    const token = generateToken(user._id);
    res.json({ token, user: { id: user._id, email: user.email, points: user.points } });
  } catch (error) {
    console.error('Login error for email:', req.body.email || 'unknown', 'from IP:', req.ip, error.message, error.stack);
    res.status(500).json({ message: 'Login failed due to server error', error: error.message });
  }
});

// POST /api/forgot-password - Password reset (placeholder)
router.post('/forgot-password', checkDbConnection, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email }).catch(err => {
      console.error('Database error during forgot password for email:', email, err.message, err.stack);
      throw new Error('Database operation failed during forgot password');
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // In a real app, send a reset link via email. Here, we just return a message.
    console.log('Password reset requested for email:', email, 'from IP:', req.ip);
    res.json({ message: 'Password reset link has been sent to your email' });
  } catch (error) {
    console.error('Password reset error for email:', req.body.email || 'unknown', 'from IP:', req.ip, error.message, error.stack);
    res.status(500).json({ message: 'Password reset failed due to server error', error: error.message });
  }
});

// POST /api/photos/upload - Upload photo
router.post('/photos/upload', authMiddleware, checkDbConnection, uploadMiddleware.single('photo'), async (req, res) => {
  try {
    const { gender, age } = req.body;
    if (!gender || !age) {
      return res.status(400).json({ message: 'Gender and age are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const photo = new Photo({
      userId: req.user.id,
      filePath: `/uploads/${req.file.filename}`,
      gender,
      age: parseInt(age, 10)
    });
    await photo.save().catch(err => {
      console.error('Database error during photo save for user:', req.user.id, err.message, err.stack);
      throw new Error('Database operation failed during photo save');
    });

    console.log('Photo uploaded successfully by user:', req.user.id, 'from IP:', req.ip);
    res.status(201).json({ photo });
  } catch (error) {
    console.error('Photo upload error for user:', req.user?.id || 'unknown', 'from IP:', req.ip, error.message, error.stack);
    res.status(500).json({ message: 'Photo upload failed due to server error', error: error.message });
  }
});

// GET /api/photos/to-rate - Get photos to rate with filters
router.get('/photos/to-rate', authMiddleware, checkDbConnection, async (req, res) => {
  try {
    const { gender, minAge, maxAge } = req.query;
    const query = { 
      userId: { $ne: req.user.id },
      isActive: true
    };

    if (gender) {
      query.gender = gender;
    }
    if (minAge && maxAge) {
      query.age = { $gte: parseInt(minAge, 10), $lte: parseInt(maxAge, 10) };
    }

    const photos = await Photo.find(query).limit(1).catch(err => {
      console.error('Database error during photo fetch for user:', req.user.id, err.message, err.stack);
      throw new Error('Database operation failed during photo fetch');
    });
    console.log('Photos fetched for rating by user:', req.user.id, 'from IP:', req.ip);
    res.json({ photos });
  } catch (error) {
    console.error('Fetch photos error for user:', req.user?.id || 'unknown', 'from IP:', req.ip, error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch photos due to server error', error: error.message });
  }
});

// POST /api/photos/rate - Rate a photo
router.post('/photos/rate', authMiddleware, checkDbConnection, async (req, res) => {
  try {
    const { photoId } = req.body;
    if (!photoId) {
      return res.status(400).json({ message: 'Photo ID is required' });
    }

    const photo = await Photo.findById(photoId).catch(err => {
      console.error('Database error during photo lookup for photoId:', photoId, err.message, err.stack);
      throw new Error('Database operation failed during photo lookup');
    });
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    if (photo.userId.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot rate your own photo' });
    }

    const existingRating = await Rating.findOne({ photoId, raterId: req.user.id }).catch(err => {
      console.error('Database error during rating check for photoId:', photoId, 'and user:', req.user.id, err.message, err.stack);
      throw new Error('Database operation failed during rating check');
    });
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this photo' });
    }

    // Add rating
    const rating = new Rating({ photoId, raterId: req.user.id });
    await rating.save().catch(err => {
      console.error('Database error during rating save for photoId:', photoId, 'and user:', req.user.id, err.message, err.stack);
      throw new Error('Database operation failed during rating save');
    });

    // Update points: +1 for rater, -1 for photo owner
    await User.findByIdAndUpdate(req.user.id, { $inc: { points: 1 } }).catch(err => {
      console.error('Database error during rater points update for user:', req.user.id, err.message, err.stack);
      throw new Error('Database operation failed during rater points update');
    });
    await User.findByIdAndUpdate(photo.userId, { $inc: { points: -1 } }).catch(err => {
      console.error('Database error during owner points update for user:', photo.userId, err.message, err.stack);
      throw new Error('Database operation failed during owner points update');
    });

    console.log('Photo rated successfully, photoId:', photoId, 'by user:', req.user.id, 'from IP:', req.ip);
    res.json({ message: 'Photo rated successfully' });
  } catch (error) {
    console.error('Rating error for photoId:', req.body.photoId || 'unknown', 'by user:', req.user?.id || 'unknown', 'from IP:', req.ip, error.message, error.stack);
    res.status(500).json({ message: 'Rating failed due to server error', error: error.message });
  }
});

// POST /api/photos/toggle-active - Toggle photo active status
router.post('/photos/toggle-active', authMiddleware, checkDbConnection, async (req, res) => {
  try {
    const { photoId, isActive } = req.body;
    if (!photoId) {
      return res.status(400).json({ message: 'Photo ID is required' });
    }

    const user = await User.findById(req.user.id).catch(err => {
      console.error('Database error during user lookup for user:', req.user.id, err.message, err.stack);
      throw new Error('Database operation failed during user lookup');
    });
    if (user.points <= 0 && isActive) {
      return res.status(400).json({ message: 'Not enough points to activate photo' });
    }

    const photo = await Photo.findOne({ _id: photoId, userId: req.user.id }).catch(err => {
      console.error('Database error during photo lookup for photoId:', photoId, 'and user:', req.user.id, err.message, err.stack);
      throw new Error('Database operation failed during photo lookup');
    });
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found or not owned by user' });
    }

    photo.isActive = isActive;
    await photo.save().catch(err => {
      console.error('Database error during photo update for photoId:', photoId, err.message, err.stack);
      throw new Error('Database operation failed during photo update');
    });

    console.log('Photo status toggled for photoId:', photoId, 'to active:', isActive, 'by user:', req.user.id, 'from IP:', req.ip);
    res.json({ message: 'Photo status updated', photo });
  } catch (error) {
    console.error('Toggle photo status error for photoId:', req.body.photoId || 'unknown', 'by user:', req.user?.id || 'unknown', 'from IP:', req.ip, error.message, error.stack);
    res.status(500).json({ message: 'Failed to update photo status due to server error', error: error.message });
  }
});

// GET /api/photos/my-photos - Get user's photos
router.get('/photos/my-photos', authMiddleware, checkDbConnection, async (req, res) => {
  try {
    const photos = await Photo.find({ userId: req.user.id }).catch(err => {
      console.error('Database error during user photos fetch for user:', req.user.id, err.message, err.stack);
      throw new Error('Database operation failed during user photos fetch');
    });
    console.log('User photos fetched for user:', req.user.id, 'from IP:', req.ip);
    res.json({ photos });
  } catch (error) {
    console.error('Fetch user photos error for user:', req.user?.id || 'unknown', 'from IP:', req.ip, error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch user photos due to server error', error: error.message });
  }
});

// GET /api/stats/photo/:id - Get rating stats for a photo by gender and age
router.get('/stats/photo/:id', authMiddleware, checkDbConnection, async (req, res) => {
  try {
    const photoId = req.params.id;
    const photo = await Photo.findOne({ _id: photoId, userId: req.user.id }).catch(err => {
      console.error('Database error during photo lookup for photoId:', photoId, 'and user:', req.user.id, err.message, err.stack);
      throw new Error('Database operation failed during photo lookup');
    });
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found or not owned by user' });
    }

    const ratings = await Rating.find({ photoId }).populate('raterId').catch(err => {
      console.error('Database error during ratings fetch for photoId:', photoId, err.message, err.stack);
      throw new Error('Database operation failed during ratings fetch');
    });
    const stats = {
      total: ratings.length,
      byGender: { male: 0, female: 0, other: 0 },
      byAge: { under20: 0, between20and30: 0, over30: 0 }
    };

    for (const rating of ratings) {
      const raterPhoto = await Photo.findOne({ userId: rating.raterId._id }).catch(err => {
        console.error('Database error during rater photo lookup for raterId:', rating.raterId._id, err.message, err.stack);
        return null;
      });
      if (raterPhoto) {
        stats.byGender[raterPhoto.gender]++;
        if (raterPhoto.age < 20) stats.byAge.under20++;
        else if (raterPhoto.age <= 30) stats.byAge.between20and30++;
        else stats.byAge.over30++;
      }
    }

    console.log('Stats fetched for photoId:', photoId, 'by user:', req.user.id, 'from IP:', req.ip);
    res.json({ stats });
  } catch (error) {
    console.error('Fetch stats error for photoId:', req.params.id || 'unknown', 'by user:', req.user?.id || 'unknown', 'from IP:', req.ip, error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch stats due to server error', error: error.message });
  }
});

module.exports = router;
