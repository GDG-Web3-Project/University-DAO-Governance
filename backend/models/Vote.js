import mongoose from 'mongoose';

const VoteSchema = new mongoose.Schema({
  proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  choice: { type: String, enum: ['for', 'against'], required: true },
  createdAt: { type: Date, default: () => new Date() }
});

VoteSchema.index({ proposalId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Vote || mongoose.model('Vote', VoteSchema);
