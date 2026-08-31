import mongoose from 'mongoose';
import dbConnect from '../lib/db.js';
import Pen from '../models/Pen.js';
import Flock from '../models/Flock.js';

async function syncPens() {
  await dbConnect();
  const pens = await Pen.find({});
  const flocks = await Flock.find({ status: { $ne: 'sold' } });

  for (const pen of pens) {
    const assignedFlocks = flocks.filter((f) => f.penId && f.penId.toString() === pen._id.toString());
    const liveBirdCount = assignedFlocks.reduce((sum, f) => sum + (f.current_bird_count || 0), 0);
    
    pen.current_bird_count = liveBirdCount;
    pen.status = liveBirdCount > 0 ? 'active' : 'empty';
    if (liveBirdCount === 0) {
      pen.flockId = null;
    }
    await pen.save();
    console.log(`Synced ${pen.name}: live birds = ${liveBirdCount}`);
  }
  process.exit(0);
}

syncPens().catch((err) => {
  console.error(err);
  process.exit(1);
});
