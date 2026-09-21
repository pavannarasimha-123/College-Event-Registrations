const notFoundHandler = (req, res, next) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Mongoose Bad ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid resource ID format: ${err.value}` });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    if (err.keyPattern && err.keyPattern.studentId && err.keyPattern.eventId) {
      return res.status(409).json({ message: 'You are already registered for this event.' });
    }
    return res.status(409).json({ message: `A record with this ${field} already exists.` });
  }

  // JSON Web Token errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Authentication token has expired. Please log in again.' });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error occurred.'
  });
};

module.exports = { notFoundHandler, errorHandler };
