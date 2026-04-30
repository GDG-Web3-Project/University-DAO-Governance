import mongoose from 'mongoose';

const ProposalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
  scope: { type: String, enum: ['class', 'public'], default: 'class' },
  status: { type: String, enum: ['Active', 'Succeeded', 'Defeated', 'Executed'], default: 'Active' },
  startAt: { type: Date, default: () => new Date() },
  endAt: { type: Date, required: true },
  forVotes: { type: Number, default: 0 },
  againstVotes: { type: Number, default: 0 },
  createdAt: { type: Date, default: () => new Date() }
});

export default mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);
