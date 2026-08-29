import mongoose from 'mongoose';

const DailyProductionLogSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now, index: true },
    penId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pen', required: true },
    flockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flock' },
    goodEggs: { type: Number, required: true, min: 0 },
    damagedEggs: { type: Number, default: 0, min: 0 },
    totalEggs: { type: Number, required: true }, // good + damaged
    crates: { type: Number, required: true },    // Math.floor(total / 30)
    looseEggs: { type: Number, required: true }, // total % 30
    mortality: { type: Number, default: 0, min: 0 },
    culls: { type: Number, default: 0, min: 0 },
    hdepPercentage: { type: Number, default: 0 }, // (totalEggs / liveBirds) * 100
    loggedBy: { type: String, default: 'Farm Attendant' },
    notes: String
  },
  { timestamps: true }
);

export default mongoose.models.DailyProductionLog || mongoose.model('DailyProductionLog', DailyProductionLogSchema);
