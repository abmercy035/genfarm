import dbConnect from '@/lib/db';
import DailyConsumptionLog from '@/models/DailyConsumptionLog';
import Pen from '@/models/Pen';
import { NextResponse } from 'next/server';

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
      return NextResponse.json({ success: false, error: 'Target Pen not found' }, { status: 404 });
    }

    const bags = Number(bagsConsumed);
    const weight = Number(bagWeightKg);
    const totalKg = bags * weight;

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
      loggedBy: loggedBy || 'Farm Attendant',
      notes
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
