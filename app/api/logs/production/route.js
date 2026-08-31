import dbConnect from '@/lib/db';
import DailyProductionLog from '@/models/DailyProductionLog';
import Pen from '@/models/Pen';
import Flock from '@/models/Flock';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

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
      return NextResponse.json({ success: false, error: 'Target Pen not found.' }, { status: 404 });
    }

    // Strict inventory validation: Check active assigned flocks and live bird count
    const activeFlocks = await Flock.find({ penId, status: { $ne: 'sold' } });
    const liveBirdCount = activeFlocks.reduce((sum, f) => sum + (f.current_bird_count || 0), 0);

    if (activeFlocks.length === 0 || liveBirdCount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot log production for "${pen.name}". This pen is empty (0 live birds assigned). Please assign an active flock first.` 
        },
        { status: 400 }
      );
    }

    const good = Number(goodEggs);
    const bad = Number(damagedEggs);
    
    // Crate breakdown is calculated strictly from saleable Good Eggs
    const crates = Math.floor(good / 30);
    const looseEggs = good % 30;

    // Hen-Day Production HDEP % considers all layed eggs (good + bad)
    const totalCollected = good + bad;

    const dead = Number(mortality);
    const sick = Number(culls);
    const totalLoss = dead + sick;

    const currentLive = Math.max(0, pen.current_bird_count - totalLoss);

    // Hen-Day Production HDEP % = (Total Eggs Collected / Live Birds) * 100
    const hdepPercentage = currentLive > 0 ? ((totalCollected / currentLive) * 100).toFixed(1) : 0;

    const user = await authenticate(request);
    const authorName = user?.name || loggedBy || 'Farm Attendant';

    const log = await DailyProductionLog.create({
      date: date ? new Date(date) : new Date(),
      penId,
      flockId: pen.flockId || null,
      goodEggs: good,
      damagedEggs: bad,
      totalEggs: totalCollected,
      crates,
      looseEggs,
      mortality: dead,
      culls: sick,
      hdepPercentage: Number(hdepPercentage),
      loggedBy: authorName,
      notes
    });

    // Proportionately deduct bird mortality loss across active flocks in this pen
    if (totalLoss > 0 && activeFlocks.length > 0) {
      let remainingLoss = totalLoss;

      for (let i = 0; i < activeFlocks.length; i++) {
        const flock = activeFlocks[i];
        if (remainingLoss <= 0) break;

        // Determine proportional share of loss or remaining loss
        const lossForFlock = i === activeFlocks.length - 1
          ? Math.min(flock.current_bird_count, remainingLoss)
          : Math.min(flock.current_bird_count, Math.round((flock.current_bird_count / liveBirdCount) * totalLoss));

        flock.current_bird_count = Math.max(0, flock.current_bird_count - lossForFlock);
        await flock.save();

        remainingLoss -= lossForFlock;
      }
    }

    // Recalculate exact total live bird count for pen from active flocks
    const updatedActiveFlocks = await Flock.find({ penId, status: { $ne: 'sold' } });
    const finalPenLiveCount = updatedActiveFlocks.reduce((sum, f) => sum + (f.current_bird_count || 0), 0);

    pen.current_bird_count = finalPenLiveCount;
    await pen.save();

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
