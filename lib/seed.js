import dbConnect from '@/lib/db';
import Pen from '@/models/Pen';
import Flock from '@/models/Flock';
import DailyProductionLog from '@/models/DailyProductionLog';
import DailyConsumptionLog from '@/models/DailyConsumptionLog';

export async function seedData() {
  await dbConnect();

  // Wipe existing collections for a clean reset
  await Pen.deleteMany({});
  await Flock.deleteMany({});
  await DailyProductionLog.deleteMany({});
  await DailyConsumptionLog.deleteMany({});
  const SettingsModel = (await import('@/models/Settings')).default;
  const AccountingTransactionModel = (await import('@/models/AccountingTransaction')).default;
  await SettingsModel.deleteMany({});
  await AccountingTransactionModel.deleteMany({});

  const defaultSettings = {
    price_single_egg: 120,
    price_crate_good: 3500,
    price_single_cracked: 60,
    price_crate_cracked: 1800,
    feeds: [
      { name: 'Layer Mash 25kg', bagWeightKg: 25, pricePerBag: 12500, inStockBags: 10 },
      { name: 'Grower Mash 25kg', bagWeightKg: 25, pricePerBag: 11800, inStockBags: 10 },
      { name: 'Starter Mash 25kg', bagWeightKg: 25, pricePerBag: 13200, inStockBags: 5 },
      { name: 'Finisher Pellets 50kg', bagWeightKg: 50, pricePerBag: 24000, inStockBags: 20 }
    ],
    medications: [
      { name: 'Multivitamins & Electrolytes', unitPrice: 2500, inStockUnits: 30 },
      { name: 'Dewormer & Antibiotics', unitPrice: 4500, inStockUnits: 15 },
      { name: 'Newcastle Vaccine', unitPrice: 6000, inStockUnits: 10 }
    ],
    birdValuations: [
      { type: 'Layers', unitValue: 3500 },
      { type: 'Broilers', unitValue: 2800 },
      { type: 'Breeders', unitValue: 4200 },
      { type: 'Quarantine', unitValue: 2000 }
    ],
    defaultPenStructureValue: 450000,
    taxRatePercentage: 7.5
  };
  await SettingsModel.create(defaultSettings);

  // 1. Create Initial Pens
  const pen1 = await Pen.create({
    name: 'FIRST',
    type: 'Layers',
    location: 'Main Complex',
    capacity: 500,
    current_bird_count: 500,
    status: 'active',
    notes: 'Primary High-Yield Layer Housing'
  });

  const pen2 = await Pen.create({
    name: 'Pen B',
    type: 'Broilers',
    location: 'North Shed',
    capacity: 500,
    current_bird_count: 500,
    status: 'active',
    notes: 'Secondary Broiler Flock Housing'
  });

  // 2. Create Flocks
  const flock1 = await Flock.create({
    name: 'Batch 2024-L1 (Layers)',
    breed: 'Hy-Line Brown',
    penId: pen1._id,
    initial_bird_count: 500,
    current_bird_count: 500,
    ageWeeks: 24,
    status: 'active'
  });

  pen1.flockId = flock1._id;
  await pen1.save();

  const flock2 = await Flock.create({
    name: 'Batch 2024-B1 (Broilers)',
    breed: 'Cobb 500',
    penId: pen2._id,
    initial_bird_count: 500,
    current_bird_count: 500,
    ageWeeks: 8,
    status: 'active'
  });

  pen2.flockId = flock2._id;
  await pen2.save();

  // Create initial procurement expense vouchers for seeded flocks
  await AccountingTransactionModel.create([
    {
      type: 'EXPENSE',
      category: 'Flock Purchase / Bird Acquisition',
      amount: 500 * 3500,
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PAID',
      amountPaid: 500 * 3500,
      customerOrVendor: 'Hy-Line Hatcheries Ltd',
      referenceNo: `EXP-FLOCK-SEED-001`,
      date: new Date(),
      loggedBy: 'System Auto-Accounting (Seed)',
      notes: 'Initial Flock Acquisition: 500 Hy-Line Brown Layers @ ₦3,500/bird'
    },
    {
      type: 'EXPENSE',
      category: 'Flock Purchase / Bird Acquisition',
      amount: 500 * 2800,
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PAID',
      amountPaid: 500 * 2800,
      customerOrVendor: 'Cobb Broiler Farms Ltd',
      referenceNo: `EXP-FLOCK-SEED-002`,
      date: new Date(),
      loggedBy: 'System Auto-Accounting (Seed)',
      notes: 'Initial Flock Acquisition: 500 Cobb 500 Broilers @ ₦2,800/bird'
    }
  ]);

  // 3. Seed initial production logs for Pen 1
  await DailyProductionLog.create([
    {
      date: new Date(),
      penId: pen1._id,
      flockId: flock1._id,
      goodEggs: 420,
      damagedEggs: 10,
      totalEggs: 430,
      crates: 14,
      looseEggs: 0,
      mortality: 0,
      culls: 0,
      hdepPercentage: 86.0,
      loggedBy: 'Chief Attendant John',
      notes: 'Optimal morning harvest.'
    }
  ]);

  // 4. Seed initial consumption log
  await DailyConsumptionLog.create([
    {
      date: new Date(),
      penId: pen1._id,
      flockId: flock1._id,
      feedType: 'Layer Mash 25kg',
      bagsConsumed: 2,
      bagWeightKg: 25,
      totalWeightKg: 50,
      waterLiters: 120,
      medicationAdministered: 'Multivitamins',
      loggedBy: 'Chief Attendant John',
      notes: 'Morning feeding completed.'
    }
  ]);

  // 5. Seed Users for RBAC Roles
  const bcrypt = await import('bcryptjs');
  const hashedPass = await bcrypt.default.hash('Genfarm2026.com', 10);
  const User = (await import('@/models/User')).default;

  await User.deleteMany({});
  await User.create([
    {
      name: 'General Manager',
      phone: '08022493235',
      email: 'admin@genfarm.com',
      password: hashedPass,
      role: 'SUPER_ADMIN',
      isActive: true
    }
  ]);

  return { success: true, message: 'Database reset & reseeded successfully.' };
}
