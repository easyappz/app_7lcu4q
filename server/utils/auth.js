const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Hash password
const exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password
exports.comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, 'SECRET_KEY', { expiresIn: '1h' });
};

// Verify JWT token
exports.verifyToken = (token) => {
  return jwt.verify(token, 'SECRET_KEY');
};
