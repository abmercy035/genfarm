import mongoose from 'mongoose';

const PenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g., "Pen 1 - North Shed"
    type: { 
      type: String, 
      enum: ['Layers', 'Broilers', 'Breeders', 'Quarantine', 'General'], 
      default: 'Layers' 
    },
    location: { type: String, default: 'Main Complex' },
    capacity: { type: Number, required: true, min: 1 },
    current_bird_count: { type: Number, required: true, min: 0 },
    status: { 
      type: String, 
      enum: ['active', 'quarantine', 'empty', 'maintenance'], 
      default: 'active' 
    },
    flockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flock' },
    notes: String
  },
  { timestamps: true }
);

export default mongoose.models.Pen || mongoose.model('Pen', PenSchema);
