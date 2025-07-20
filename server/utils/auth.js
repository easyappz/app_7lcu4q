const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT secret key (hardcoded since .env is not used as per instructions)
const JWT_SECRET = 'my-secret-key-123';

// Hash password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
};
