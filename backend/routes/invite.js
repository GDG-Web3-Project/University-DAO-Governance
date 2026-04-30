import express from 'express';
import Invite from '../models/Invite.js';
import ClassModel from '../models/Class.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin users can generate invite codes' });
  }

  const { classSlug, expiresInHours } = req.body;
  if (!classSlug) {
    return res.status(400).json({ message: 'classSlug is required' });
  }

  const classDoc = await ClassModel.findOne({ slug: classSlug });
  if (!classDoc) {
    return res.status(404).json({ message: 'Class not found' });
  }

  const code = `UNI-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * (expiresInHours || 72));

  const invite = await Invite.create({
    code,
    classId: classDoc._id,
    createdBy: req.user._id,
    expiresAt
  });

  res.status(201).json({
    invite: {
      code: invite.code,
      class: classDoc.name,
      expiresAt: invite.expiresAt
    }
  });
});

router.get('/validate', async (req, res) => {
  const code = (req.query.code || '').toString().toUpperCase().trim();
  if (!code) {
    return res.status(400).json({ message: 'Invite code is required' });
  }

  const invite = await Invite.findOne({ code }).populate('classId');
  if (!invite) {
    return res.status(404).json({ message: 'Invite code not found' });
  }
  if (invite.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Invite code has expired' });
  }
  if (invite.usedBy) {
    return res.status(400).json({ message: 'Invite code has already been used' });
  }

  res.json({
    code: invite.code,
    class: {
      id: invite.classId._id.toString(),
      name: invite.classId.name,
      slug: invite.classId.slug,
      isPublic: invite.classId.isPublic
    },
    expiresAt: invite.expiresAt
  });
});

export default router;
