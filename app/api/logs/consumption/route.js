import dbConnect from '@/lib/db';
import DailyConsumptionLog from '@/models/DailyConsumptionLog';
import Pen from '@/models/Pen';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const logs = await DailyConsumptionLog.find({})
      .populate('penId')
      .populate('flockId')
      .sort({ date: -1 });
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { penId, feedType, bagsConsumed, bagWeightKg = 25, waterLiters = 0, medicationAdministered, loggedBy, notes, date } = body;

    if (!penId || bagsConsumed === undefined) {
      return NextResponse.json(
        { success: false, error: 'Pen selection and bags consumed are required.' },
        { status: 400 }
      );
    }

    const pen = await Pen.findById(penId);
    if (!pen) {
      return NextResponse.json({ success: false, error: 'Target Pen not found.' }, { status: 404 });
    }

    // Strict inventory validation: Check active assigned flocks and live bird count
    const activeFlocks = await Flock.find({ penId, status: { $ne: 'sold' } });
    const liveBirdCount = activeFlocks.reduce((sum, f) => sum + (f.current_bird_count || 0), 0);

    if (activeFlocks.length === 0 || liveBirdCount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot log feed consumption for "${pen.name}". This pen is empty (0 live birds assigned). Please assign an active flock first.` 
        },
        { status: 400 }
      );
    }

    const bags = Number(bagsConsumed);
    const weight = Number(bagWeightKg);
    const totalKg = bags * weight;

    const user = await authenticate(request);
    const authorName = user?.name || loggedBy || 'Farm Attendant';

    const log = await DailyConsumptionLog.create({
      date: date ? new Date(date) : new Date(),
      penId,
      flockId: pen.flockId || null,
      feedType: feedType || 'Layer Mash',
      bagsConsumed: bags,
      bagWeightKg: weight,
      totalWeightKg: totalKg,
      waterLiters: Number(waterLiters),
      medicationAdministered,
      loggedBy: authorName,
      notes
    });

    // Deduct consumed bags from Settings Feed Catalog inventory
    const SettingsModel = (await import('@/models/Settings')).default;
    let settings = await SettingsModel.findOne({});
    if (settings && settings.feeds) {
      const feedIndex = settings.feeds.findIndex(f => f.name === (feedType || 'Layer Mash'));
      if (feedIndex !== -1) {
        settings.feeds[feedIndex].inStockBags = Math.max(0, (settings.feeds[feedIndex].inStockBags || 0) - bags);
        await settings.save();
      }
    }

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
