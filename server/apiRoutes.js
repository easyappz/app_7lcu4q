const express = require('express');
const router = express.Router();
const User = require('./models/User');
const Photo = require('./models/Photo');
const Rating = require('./models/Rating');
const { hashPassword, comparePassword, generateToken } = require('./utils/auth');
const authMiddleware = require('./middleware/auth');
const uploadMiddleware = require('./middleware/upload');

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
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ token, user: { id: user._id, email: user.email, points: user.points } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// POST /api/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({ token, user: { id: user._id, email: user.email, points: user.points } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// POST /api/forgot-password - Password reset (placeholder)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // In a real app, send a reset link via email. Here, we just return a message.
    res.json({ message: 'Password reset link has been sent to your email' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
});

// POST /api/photos/upload - Upload photo
router.post('/photos/upload', authMiddleware, uploadMiddleware.single('photo'), async (req, res) => {
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
    await photo.save();

    res.status(201).json({ photo });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ message: 'Photo upload failed', error: error.message });
  }
});

// GET /api/photos/to-rate - Get photos to rate with filters
router.get('/photos/to-rate', authMiddleware, async (req, res) => {
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

    const photos = await Photo.find(query).limit(1);
    res.json({ photos });
  } catch (error) {
    console.error('Fetch photos error:', error);
    res.status(500).json({ message: 'Failed to fetch photos', error: error.message });
  }
});

// POST /api/photos/rate - Rate a photo
router.post('/photos/rate', authMiddleware, async (req, res) => {
  try {
    const { photoId } = req.body;
    if (!photoId) {
      return res.status(400).json({ message: 'Photo ID is required' });
    }

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    if (photo.userId.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot rate your own photo' });
    }

    const existingRating = await Rating.findOne({ photoId, raterId: req.user.id });
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this photo' });
    }

    // Add rating
    const rating = new Rating({ photoId, raterId: req.user.id });
    await rating.save();

    // Update points: +1 for rater, -1 for photo owner
    await User.findByIdAndUpdate(req.user.id, { $inc: { points: 1 } });
    await User.findByIdAndUpdate(photo.userId, { $inc: { points: -1 } });

    res.json({ message: 'Photo rated successfully' });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ message: 'Rating failed', error: error.message });
  }
});

// POST /api/photos/toggle-active - Toggle photo active status
router.post('/photos/toggle-active', authMiddleware, async (req, res) => {
  try {
    const { photoId, isActive } = req.body;
    if (!photoId) {
      return res.status(400).json({ message: 'Photo ID is required' });
    }

    const user = await User.findById(req.user.id);
    if (user.points <= 0 && isActive) {
      return res.status(400).json({ message: 'Not enough points to activate photo' });
    }

    const photo = await Photo.findOne({ _id: photoId, userId: req.user.id });
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found or not owned by user' });
    }

    photo.isActive = isActive;
    await photo.save();

    res.json({ message: 'Photo status updated', photo });
  } catch (error) {
    console.error('Toggle photo status error:', error);
    res.status(500).json({ message: 'Failed to update photo status', error: error.message });
  }
});

// GET /api/photos/my-photos - Get user's photos
router.get('/photos/my-photos', authMiddleware, async (req, res) => {
  try {
    const photos = await Photo.find({ userId: req.user.id });
    res.json({ photos });
  } catch (error) {
    console.error('Fetch user photos error:', error);
    res.status(500).json({ message: 'Failed to fetch user photos', error: error.message });
  }
});

// GET /api/stats/photo/:id - Get rating stats for a photo by gender and age
router.get('/stats/photo/:id', authMiddleware, async (req, res) => {
  try {
    const photoId = req.params.id;
    const photo = await Photo.findOne({ _id: photoId, userId: req.user.id });
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found or not owned by user' });
    }

    const ratings = await Rating.find({ photoId }).populate('raterId');
    const stats = {
      total: ratings.length,
      byGender: { male: 0, female: 0, other: 0 },
      byAge: { under20: 0, between20and30: 0, over30: 0 }
    };

    for (const rating of ratings) {
      const raterPhoto = await Photo.findOne({ userId: rating.raterId._id });
      if (raterPhoto) {
        stats.byGender[raterPhoto.gender]++;
        if (raterPhoto.age < 20) stats.byAge.under20++;
        else if (raterPhoto.age <= 30) stats.byAge.between20and30++;
        else stats.byAge.over30++;
      }
    }

    res.json({ stats });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

module.exports = router;
