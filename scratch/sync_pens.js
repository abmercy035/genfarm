const mongoose = require('mongoose');

const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/genfarm';

async function sync() {
  await mongoose.connect(dbUri);
  console.log('Connected to DB');

  const Pen = mongoose.connection.collection('pens');
  const Flock = mongoose.connection.collection('flocks');

  const flocks = await Flock.find({ status: { $ne: 'sold' } }).toArray();
  const pens = await Pen.find({}).toArray();

  for (const pen of pens) {
    const assigned = flocks.filter(f => f.penId && f.penId.toString() === pen._id.toString());
    const liveCount = assigned.reduce((sum, f) => sum + (f.current_bird_count || 0), 0);
    const statusVal = liveCount > 0 ? 'active' : 'empty';

    await Pen.updateOne(
      { _id: pen._id },
      { 
        $set: { 
          current_bird_count: liveCount, 
          status: statusVal,
          flockId: liveCount > 0 ? pen.flockId : null
        } 
      }
    );
    console.log(`Pen "${pen.name}" synced -> Live Birds: ${liveCount}, Status: ${statusVal}`);
  }

  process.exit(0);
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});
