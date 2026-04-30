import express from 'express';
import Proposal from '../models/Proposal.js';
import Vote from '../models/Vote.js';
import ClassModel from '../models/Class.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, async (req, res) => {
  const user = req.user;
  const conditions = [{ scope: 'public' }];

  if (user?.classId) {
    conditions.push({ scope: 'class', classId: user.classId._id });
  }

  const proposals = await Proposal.find({ $or: conditions })
    .sort({ createdAt: -1 })
    .populate('authorId', 'name email')
    .populate('classId', 'name slug');

  const formatted = proposals.map((proposal) => ({
    id: proposal._id.toString(),
    title: proposal.title,
    description: proposal.description,
    state: proposal.status,
    forVotes: proposal.forVotes,
    againstVotes: proposal.againstVotes,
    scope: proposal.scope,
    className: proposal.classId?.name || 'Public',
    author: proposal.authorId?.name || 'Unknown',
    startAt: proposal.startAt.getTime(),
    endAt: proposal.endAt.getTime(),
    hasVoted: false
  }));

  if (user) {
    const voteRecords = await Vote.find({ proposalId: { $in: proposals.map((p) => p._id) }, userId: user._id });
    const voteSet = new Set(voteRecords.map((vote) => vote.proposalId.toString()));
    formatted.forEach((proposal) => {
      if (voteSet.has(proposal.id)) {
        proposal.hasVoted = true;
      }
    });
  }

  res.json({ proposals: formatted });
});

router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const proposal = await Proposal.findById(id)
    .populate('authorId', 'name email')
    .populate('classId', 'name slug');

  if (!proposal) {
    return res.status(404).json({ message: 'Proposal not found' });
  }

  if (proposal.scope === 'class' && (!user || user.classId?._id.toString() !== proposal.classId?._id.toString())) {
    return res.status(403).json({ message: 'You are not authorized to view this class proposal' });
  }

  const voteRecords = await Vote.find({ proposalId: proposal._id }).populate('userId', 'name email');
  const hasVoted = user ? voteRecords.some((vote) => vote.userId._id.toString() === user._id.toString()) : false;

  res.json({
    proposal: {
      id: proposal._id.toString(),
      title: proposal.title,
      description: proposal.description,
      state: proposal.status,
      forVotes: proposal.forVotes,
      againstVotes: proposal.againstVotes,
      scope: proposal.scope,
      className: proposal.classId?.name || 'Public',
      author: proposal.authorId?.name || 'Unknown',
      authorEmail: proposal.authorId?.email,
      startAt: proposal.startAt.getTime(),
      endAt: proposal.endAt.getTime(),
      createdAt: proposal.createdAt.getTime(),
      hasVoted,
      votes: voteRecords.map((vote) => ({
        choice: vote.choice,
        createdAt: vote.createdAt.getTime(),
        user: {
          id: vote.userId._id.toString(),
          name: vote.userId.name,
          email: vote.userId.email
        }
      }))
    }
  });
});

router.post('/', authMiddleware, async (req, res) => {
  const user = req.user;
  const { title, description, durationDays, scope } = req.body;

  if (!title || !description || !durationDays) {
    return res.status(400).json({ message: 'Title, description, and duration are required' });
  }

  if (scope === 'class' && !user.classId) {
    return res.status(400).json({ message: 'Only class members can create class proposals' });
  }

  const endAt = new Date(Date.now() + Math.max(1, Number(durationDays)) * 24 * 60 * 60 * 1000);

  const proposal = await Proposal.create({
    title: title.trim(),
    description: description.trim(),
    authorId: user._id,
    classId: scope === 'class' ? user.classId._id : null,
    scope: scope === 'public' ? 'public' : 'class',
    startAt: new Date(),
    endAt
  });

  res.status(201).json({
    proposal: {
      id: proposal._id.toString(),
      title: proposal.title,
      description: proposal.description,
      state: proposal.status,
      scope: proposal.scope,
      className: scope === 'public' ? 'Public' : user.classId?.name || 'Class',
      startAt: proposal.startAt.getTime(),
      endAt: proposal.endAt.getTime()
    }
  });
});

router.post('/:id/vote', authMiddleware, async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const { choice } = req.body;

  if (!choice || !['for', 'against'].includes(choice)) {
    return res.status(400).json({ message: 'Vote choice must be either for or against' });
  }

  const proposal = await Proposal.findById(id).populate('classId');
  if (!proposal) {
    return res.status(404).json({ message: 'Proposal not found' });
  }

  if (proposal.scope === 'class' && (!user.classId || user.classId._id.toString() !== proposal.classId._id.toString())) {
    return res.status(403).json({ message: 'Class members only can vote on this proposal' });
  }

  const existingVote = await Vote.findOne({ proposalId: proposal._id, userId: user._id });
  if (existingVote) {
    return res.status(400).json({ message: 'You have already voted on this proposal' });
  }

  const vote = await Vote.create({ proposalId: proposal._id, userId: user._id, choice });

  if (choice === 'for') {
    proposal.forVotes += 1;
  } else {
    proposal.againstVotes += 1;
  }

  await proposal.save();

  res.status(201).json({
    vote: {
      id: vote._id.toString(),
      choice: vote.choice,
      createdAt: vote.createdAt.getTime()
    }
  });
});

export default router;
