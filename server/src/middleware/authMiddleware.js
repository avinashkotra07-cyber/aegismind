import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_aegismind_jwt_key_32_chars_min';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No Bearer token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User account not found or access revoked.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired JWT token.' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Insufficient privilege. Required role: [${roles.join(', ')}], Current role: ${req.user?.role}`
      });
    }
    next();
  };
};
