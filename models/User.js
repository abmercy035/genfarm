import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['WORKER', 'ADMIN', 'SUPER_ADMIN'],
      default: 'WORKER',
      required: true,
      index: true
    },
    isActive: { type: Boolean, default: true },
    assignedPens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pen' }]
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
