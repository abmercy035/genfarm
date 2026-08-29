import mongoose from 'mongoose';

const FlockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g., "Batch 2024-B1 Layers"
    breed: { type: String, default: 'Hy-Line Brown' },
    penId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pen' },
    initial_bird_count: { type: Number, required: true, min: 1 },
    current_bird_count: { type: Number, required: true, min: 0 },
    ageWeeks: { type: Number, default: 20 },
    status: { 
      type: String, 
      enum: ['active', 'sold', 'culled', 'quarantined'], 
      default: 'active' 
    },
    startDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.Flock || mongoose.model('Flock', FlockSchema);
