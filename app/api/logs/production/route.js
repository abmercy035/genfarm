import dbConnect from '@/lib/db';
import DailyProductionLog from '@/models/DailyProductionLog';
import Pen from '@/models/Pen';
import Flock from '@/models/Flock';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const logs = await DailyProductionLog.find({})
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
    const { penId, goodEggs, damagedEggs = 0, mortality = 0, culls = 0, loggedBy, notes, date } = body;

    if (!penId || goodEggs === undefined) {
      return NextResponse.json(
        { success: false, error: 'Pen selection and good eggs count are required.' },
        { status: 400 }
      );
    }

    const pen = await Pen.findById(penId);
    if (!pen) {
      return NextResponse.json({ success: false, error: 'Target Pen not found' }, { status: 404 });
    }

    const good = Number(goodEggs);
    const bad = Number(damagedEggs);
    const total = good + bad;
    const crates = Math.floor(total / 30);
    const looseEggs = total % 30;

    const dead = Number(mortality);
    const sick = Number(culls);
    const totalLoss = dead + sick;

    const currentLive = Math.max(0, pen.current_bird_count - totalLoss);

    // Hen-Day Production HDEP % = (Total Eggs Collected / Live Birds) * 100
    const hdepPercentage = currentLive > 0 ? ((total / currentLive) * 100).toFixed(1) : 0;

    const log = await DailyProductionLog.create({
      date: date ? new Date(date) : new Date(),
      penId,
      flockId: pen.flockId || null,
      goodEggs: good,
      damagedEggs: bad,
      totalEggs: total,
      crates,
      looseEggs,
      mortality: dead,
      culls: sick,
      hdepPercentage: Number(hdepPercentage),
      loggedBy: loggedBy || 'Farm Attendant',
      notes
    });

    // Update current live bird count on Pen and Flock
    pen.current_bird_count = currentLive;
    await pen.save();

    if (pen.flockId) {
      await Flock.findByIdAndUpdate(pen.flockId, { current_bird_count: currentLive });
    }

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
