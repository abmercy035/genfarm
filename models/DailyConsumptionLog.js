import mongoose from 'mongoose';

const DailyConsumptionLogSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now, index: true },
    penId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pen', required: true },
    flockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flock' },
    feedType: { type: String, required: true, default: 'Layer Mash' }, // e.g. "Layer Mash", "Grower Mash"
    bagsConsumed: { type: Number, required: true, min: 0 },
    bagWeightKg: { type: Number, default: 25 },
    totalWeightKg: { type: Number, required: true }, // (bags * weight) + extra
    waterLiters: { type: Number, default: 0 },
    medicationAdministered: String,
    loggedBy: { type: String, default: 'Farm Attendant' },
    notes: String
  },
  { timestamps: true }
);

export default mongoose.models.DailyConsumptionLog || mongoose.model('DailyConsumptionLog', DailyConsumptionLogSchema);
