import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import ClassModel from '../models/Class.js';
import Invite from '../models/Invite.js';
import { createToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('classId');
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = createToken(user);

  res.json({
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.classId
        ? {
            id: user.classId._id.toString(),
            name: user.classId.name,
            slug: user.classId.slug,
            isPublic: user.classId.isPublic
          }
        : null
    }
  });
});

router.post('/register', async (req, res) => {
  const { name, email, password, inviteCode, walletAddress } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  let classId = null;
  let classDoc = null;

  if (inviteCode) {
    const invite = await Invite.findOne({ code: inviteCode.toUpperCase().trim() });
    if (!invite) {
      return res.status(400).json({ message: 'Invalid invite code' });
    }
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invite code has expired' });
    }
    if (invite.usedBy) {
      return res.status(400).json({ message: 'Invite code has already been used' });
    }

    classDoc = await ClassModel.findById(invite.classId);
    if (!classDoc) {
      return res.status(400).json({ message: 'Invite class could not be found' });
    }
    classId = classDoc._id;

    invite.usedBy = null; // will assign after user creation
    invite.usedAt = new Date();
    await invite.save();
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    walletAddress: walletAddress ? walletAddress.toLowerCase().trim() : null,
    classId
  });

  if (inviteCode) {
    const invite = await Invite.findOne({ code: inviteCode.toUpperCase().trim() });
    if (invite) {
      invite.usedBy = user._id;
      await invite.save();
    }
  }

  const token = createToken(user);

  res.status(201).json({
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      class: classDoc
        ? {
            id: classDoc._id.toString(),
            name: classDoc.name,
            slug: classDoc.slug,
            isPublic: classDoc.isPublic
          }
        : null
    }
  });
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = req.user;
  res.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.classId
        ? {
            id: user.classId._id.toString(),
            name: user.classId.name,
            slug: user.classId.slug,
            isPublic: user.classId.isPublic
          }
        : null
    }
  });
});

router.post('/wallet', authMiddleware, async (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ message: 'walletAddress is required' });
  req.user.walletAddress = walletAddress.toLowerCase().trim();
  await req.user.save();
  return res.json({ walletAddress: req.user.walletAddress });
});

export default router;
