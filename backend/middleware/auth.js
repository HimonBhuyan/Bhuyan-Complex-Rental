const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Middleware to authorize specific roles
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Middleware for admin-only routes
const adminOnly = (req, res, next) => {
  return authorizeRole(['owner', 'admin'])(req, res, next);
};

// Middleware for tenant-only routes
const tenantOnly = (req, res, next) => {
  return authorizeRole(['tenant'])(req, res, next);
};

// Middleware for tenant or admin routes
const tenantOrAdmin = (req, res, next) => {
  return authorizeRole(['tenant', 'owner', 'admin'])(req, res, next);
};

module.exports = {
  authenticateToken,
  authorizeRole,
  adminOnly,
  tenantOnly,
  tenantOrAdmin
};