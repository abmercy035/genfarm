import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

const DEFAULT_SETTINGS = {
  price_single_egg: 120,
  price_crate_good: 3500,
  price_single_cracked: 60,
  price_crate_cracked: 1800,
  feeds: [
    { name: 'Layer Mash 25kg', bagWeightKg: 25, pricePerBag: 12500, inStockBags: 120 },
    { name: 'Grower Mash 25kg', bagWeightKg: 25, pricePerBag: 11800, inStockBags: 80 },
    { name: 'Starter Mash 25kg', bagWeightKg: 25, pricePerBag: 13200, inStockBags: 50 },
    { name: 'Finisher Pellets 50kg', bagWeightKg: 50, pricePerBag: 24000, inStockBags: 40 }
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
  staffPayroll: [
    { staffName: 'Senior Farm Manager', roleTitle: 'General Manager', monthlySalary: 180000 },
    { staffName: 'Lead Supervisor', roleTitle: 'Moderator', monthlySalary: 120000 },
    { staffName: 'Pen Attendant 1', roleTitle: 'Worker', monthlySalary: 75000 },
    { staffName: 'Pen Attendant 2', roleTitle: 'Worker', monthlySalary: 75000 }
  ],
  taxRatePercentage: 7.5
};

export async function GET(request) {
  try {
    await dbConnect();
    let settings = await Settings.findOne({});

    if (!settings) {
      settings = await Settings.create(DEFAULT_SETTINGS);
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized token. Please re-login as Admin.' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin account required.' }, { status: 403 });
    }

    const body = await request.json();
    let settings = await Settings.findOne({});

    if (!settings) {
      settings = await Settings.create({ ...DEFAULT_SETTINGS, ...body });
    } else {
      Object.assign(settings, body);
      await settings.save();
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
