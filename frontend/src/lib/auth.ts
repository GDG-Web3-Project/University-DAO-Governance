import jwt from 'jsonwebtoken';
import dbConnect from './db';
import User from './models/User';

const jwtSecret = process.env.JWT_SECRET || 'change-this-secret';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export const createToken = (user: any) => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, jwtSecret) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const getAuthUser = async (req: Request) => {
  await dbConnect();
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const user = await User.findById(payload.id).select('-passwordHash').populate('classId');
    return user;
  } catch (error) {
    return null;
  }
};
