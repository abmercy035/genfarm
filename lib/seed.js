import dbConnect from '@/lib/db';
import Pen from '@/models/Pen';
import Flock from '@/models/Flock';
import DailyProductionLog from '@/models/DailyProductionLog';
import DailyConsumptionLog from '@/models/DailyConsumptionLog';

export async function seedData() {
  await dbConnect();

  // Clear existing if necessary or populate initial pens
  const existingPens = await Pen.countDocuments({});
  if (existingPens > 0) {
    return { message: 'Database already populated' };
  }

  // 1. Create Initial Pens
  const pen1 = await Pen.create({
    name: 'Pen 1 - Layer House A',
    type: 'Layers',
    location: 'North Shed',
    capacity: 1000,
    current_bird_count: 950,
    status: 'active',
    notes: 'Primary High-Density Layer Battery Cages'
  });

  const pen2 = await Pen.create({
    name: 'Pen 2 - Layer House B',
    type: 'Layers',
    location: 'North Shed',
    capacity: 800,
    current_bird_count: 780,
    status: 'active',
    notes: 'Secondary Layer Flock - Hy-Line Brown'
  });

  const pen3 = await Pen.create({
    name: 'Pen 3 - Broiler Run',
    type: 'Broilers',
    location: 'East Wing',
    capacity: 500,
    current_bird_count: 490,
    status: 'active',
    notes: 'Meat Production Batch #4'
  });

  const pen4 = await Pen.create({
    name: 'Pen 4 - Isolation / Quarantine',
    type: 'Quarantine',
    location: 'West Bay',
    capacity: 100,
    current_bird_count: 12,
    status: 'quarantine',
    notes: 'Observation for sick or recovered birds'
  });

  // 2. Create Flocks
  const flock1 = await Flock.create({
    name: 'Batch 2024-L1 (Layers)',
    breed: 'Hy-Line Brown',
    penId: pen1._id,
    initial_bird_count: 1000,
    current_bird_count: 950,
    ageWeeks: 24,
    status: 'active'
  });

  pen1.flockId = flock1._id;
  await pen1.save();

  const flock2 = await Flock.create({
    name: 'Batch 2024-L2 (Layers)',
    breed: 'Lohmann Brown',
    penId: pen2._id,
    initial_bird_count: 800,
    current_bird_count: 780,
    ageWeeks: 22,
    status: 'active'
  });

  pen2.flockId = flock2._id;
  await pen2.save();

  // 3. Seed initial production logs for Pen 1 & 2
  await DailyProductionLog.create([
    {
      date: new Date(),
      penId: pen1._id,
      flockId: flock1._id,
      goodEggs: 820,
      damagedEggs: 14,
      totalEggs: 834,
      crates: 27,
      looseEggs: 24,
      mortality: 2,
      culls: 1,
      hdepPercentage: 87.8,
      loggedBy: 'Chief Attendant John',
      notes: 'Optimal morning harvest.'
    },
    {
      date: new Date(),
      penId: pen2._id,
      flockId: flock2._id,
      goodEggs: 650,
      damagedEggs: 8,
      totalEggs: 658,
      crates: 21,
      looseEggs: 28,
      mortality: 1,
      culls: 0,
      hdepPercentage: 84.3,
      loggedBy: 'Attendant Sarah',
      notes: 'Normal shift.'
    }
  ]);

  // 4. Seed initial consumption log
  await DailyConsumptionLog.create([
    {
      date: new Date(),
      penId: pen1._id,
      flockId: flock1._id,
      feedType: 'Layer Mash 25kg',
      bagsConsumed: 4,
      bagWeightKg: 25,
      totalWeightKg: 100,
      waterLiters: 250,
      medicationAdministered: 'Multivitamins in water',
      loggedBy: 'Chief Attendant John',
      notes: 'Morning feeding completed.'
    }
  ]);

  return { success: true, message: 'Sample seed data created successfully.' };
}
