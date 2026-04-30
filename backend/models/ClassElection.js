import mongoose from 'mongoose';

const ClassElectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contractElectionId: { type: Number, required: true },
  txHash: { type: String, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  invitedWallets: { type: [String], default: [] },
  forVotes: { type: Number, default: 0 },
  againstVotes: { type: Number, default: 0 },
  finalized: { type: Boolean, default: false },
  createdAt: { type: Date, default: () => new Date() }
});

export default mongoose.models.ClassElection || mongoose.model('ClassElection', ClassElectionSchema);
