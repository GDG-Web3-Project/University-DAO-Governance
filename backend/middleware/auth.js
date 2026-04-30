import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const jwtSecret = process.env.JWT_SECRET || 'change-this-secret';

export const createToken = (user) => {
  return jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, jwtSecret, {
    expiresIn: '7d'
  });
};

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing authentication token' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = await User.findById(payload.id).select('-passwordHash').populate('classId');
    if (!req.user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token' });
  }
};

export const optionalAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const payload = jwt.verify(token, jwtSecret);
      req.user = await User.findById(payload.id).select('-passwordHash').populate('classId');
    } catch (error) {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};
