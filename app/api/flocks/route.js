import dbConnect from '@/lib/db';
import Flock from '@/models/Flock';
import Pen from '@/models/Pen';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const flocks = await Flock.find({}).populate('penId').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: flocks });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, breed, penId, initial_bird_count, ageWeeks, startDate } = body;

    if (!name || initial_bird_count === undefined) {
      return NextResponse.json(
        { success: false, error: 'Flock name and initial bird count are required.' },
        { status: 400 }
      );
    }

    const flock = await Flock.create({
      name,
      breed: breed || 'Hy-Line Brown',
      penId: penId || null,
      initial_bird_count: Number(initial_bird_count),
      current_bird_count: Number(initial_bird_count),
      ageWeeks: ageWeeks ? Number(ageWeeks) : 20,
      startDate: startDate ? new Date(startDate) : new Date()
    });

    if (penId) {
      // Calculate total live bird count for target pen across all assigned flocks
      const penFlocks = await Flock.find({ penId, status: { $ne: 'sold' } });
      const totalLiveInPen = penFlocks.reduce((sum, f) => sum + (f.current_bird_count || 0), 0);

      await Pen.findByIdAndUpdate(penId, { 
        current_bird_count: totalLiveInPen,
        status: 'active'
      });
    }

    // Automatically post Accounting Expense Voucher for Flock Acquisition
    let createdTransactionRef = null;
    try {
      const SettingsModel = (await import('@/models/Settings')).default;
      const TransactionModel = (await import('@/models/AccountingTransaction')).default;
      let settings = await SettingsModel.findOne({});
      if (!settings) settings = await SettingsModel.create({});

      // Resolve bird valuation unit price per bird dynamically from catalog
      const breedStr = (breed || '').toLowerCase();
      let birdRate = 3500; // default layer valuation rate
      const valuations = settings.birdValuations || [];

      // Check for exact or partial category match in catalog
      const matchedValuation = valuations.find(v => 
        v.type.toLowerCase().includes(breedStr) || breedStr.includes(v.type.toLowerCase())
      );

      if (matchedValuation && matchedValuation.unitValue > 0) {
        birdRate = matchedValuation.unitValue;
      } else if (breedStr.includes('broiler') || breedStr.includes('cobb')) {
        const broilerMatch = valuations.find(v => v.type.toLowerCase().includes('broiler'));
        birdRate = broilerMatch ? broilerMatch.unitValue : 2800;
      } else {
        const layerMatch = valuations.find(v => v.type.toLowerCase().includes('layer'));
        birdRate = layerMatch ? layerMatch.unitValue : 3500;
      }

      const totalProcurementCost = Number(initial_bird_count) * birdRate;
      const refCount = await TransactionModel.countDocuments({});
      const referenceNo = `EXP-FLOCK-${Date.now().toString().slice(-4)}-${refCount + 1}`;

      let validDate = new Date();
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        validDate = new Date(startDate);
      }

      const autoTx = await TransactionModel.create({
        type: 'EXPENSE',
        category: 'Flock Purchase / Bird Acquisition',
        amount: totalProcurementCost,
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'PAID',
        amountPaid: totalProcurementCost,
        customerOrVendor: `${breed || 'Hatchery Vendor'} Supplier`,
        referenceNo,
        date: validDate,
        loggedBy: 'System Auto-Accounting (Flock Entry)',
        notes: `Automated ledger expense entry: Procured ${initial_bird_count} ${breed || 'birds'} @ ₦${birdRate.toLocaleString()}/bird.`
      });
      createdTransactionRef = autoTx.referenceNo;
    } catch (acctErr) {
      console.error('Failed to post automatic flock accounting expense voucher', acctErr);
    }

    return NextResponse.json({ 
      success: true, 
      data: flock,
      expenseVoucherRef: createdTransactionRef 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
