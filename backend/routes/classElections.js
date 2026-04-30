import express from 'express';
import ClassElection from '../models/ClassElection.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, async (req, res) => {
  const elections = await ClassElection.find().sort({ createdAt: -1 }).populate('classId', 'name slug');
  const wallet = (req.headers['x-wallet-address'] || '').toString().toLowerCase();
  const payload = elections.map((item) => ({
    id: item.contractElectionId.toString(),
    title: item.title,
    description: item.description,
    state: item.finalized ? 'Finalized' : 'Active',
    forVotes: item.forVotes,
    againstVotes: item.againstVotes,
    className: item.classId?.name || 'Class',
    startAt: item.startAt.getTime(),
    endAt: item.endAt.getTime(),
    canVote: wallet ? item.invitedWallets.map((w) => w.toLowerCase()).includes(wallet) : false
  }));
  res.json({ elections: payload });
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, description, classId, startAt, endAt, invitedWallets = [], contractElectionId, txHash } = req.body;
  const election = await ClassElection.create({
    title,
    description,
    classId,
    creatorId: req.user._id,
    contractElectionId: Number(contractElectionId || 0),
    txHash: txHash || '',
    startAt: new Date(startAt),
    endAt: new Date(endAt),
    invitedWallets
  });
  res.status(201).json({ electionId: election._id.toString() });
});

export default router;
