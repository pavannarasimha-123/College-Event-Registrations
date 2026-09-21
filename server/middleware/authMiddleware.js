const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Access denied. Token missing.' });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_for_development';
    const decoded = jwt.verify(token, secret);

    // Attach user information to request
    // Decoded payload contains { id, userId, email, role }
    req.user = decoded;

    // Optionally ensure user still exists in DB
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User associated with this token no longer exists.' });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please log in again.' });
    }
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

module.exports = { authenticateToken };
