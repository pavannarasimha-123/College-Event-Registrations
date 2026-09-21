const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin privileges required.' });
  }

  next();
};

const requireStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied: Student access only.' });
  }

  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Requires one of: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

module.exports = {
  requireAdmin,
  requireStudent,
  requireRole
};
