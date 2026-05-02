import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  walletAddress: { type: String, default: null, lowercase: true, trim: true, unique: true, sparse: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'worker', 'admin'], default: 'student' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
  createdAt: { type: Date, default: () => new Date() }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
