import mongoose from 'mongoose';

const InviteSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  usedAt: { type: Date, default: null },
  createdAt: { type: Date, default: () => new Date() }
});

export default mongoose.models.Invite || mongoose.model('Invite', InviteSchema);
