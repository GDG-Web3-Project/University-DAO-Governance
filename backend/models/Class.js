import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: () => new Date() }
});

export default mongoose.models.Class || mongoose.model('Class', ClassSchema);
