import dbConnect from '@/lib/db';
import Pen from '@/models/Pen';
import Flock from '@/models/Flock';
import DailyProductionLog from '@/models/DailyProductionLog';
import DailyConsumptionLog from '@/models/DailyConsumptionLog';
import AccountingTransaction from '@/models/AccountingTransaction';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();

    // 1. Total Pens & Active Flocks
    const rawPens = await Pen.find({});
    const activeFlocks = await Flock.find({ status: { $ne: 'sold' } });

    const pens = rawPens.map((pen) => {
      const penObj = pen.toObject();
      const assigned = activeFlocks.filter((f) => f.penId && f.penId.toString() === pen._id.toString());
      const liveCount = assigned.reduce((sum, f) => sum + (f.current_bird_count || 0), 0);
      penObj.current_bird_count = liveCount;
      penObj.status = liveCount > 0 ? 'active' : 'empty';
      return penObj;
    });

    const totalCapacity = pens.reduce((acc, p) => acc + p.capacity, 0);
    const totalLiveBirds = pens.reduce((acc, p) => acc + p.current_bird_count, 0);

    // 2. Today's Production Aggregation
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayProductionLogs = await DailyProductionLog.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const todayGoodEggs = todayProductionLogs.reduce((acc, l) => acc + l.goodEggs, 0);
    const todayDamagedEggs = todayProductionLogs.reduce((acc, l) => acc + l.damagedEggs, 0);
    const todayTotalEggs = todayGoodEggs + todayDamagedEggs;
    
    // Crate breakdown is calculated strictly from saleable Good Eggs (good / 30)
    const todayCrates = Math.floor(todayGoodEggs / 30);
    const todayLoose = todayGoodEggs % 30;
    const todayMortality = todayProductionLogs.reduce((acc, l) => acc + l.mortality + l.culls, 0);

    // Hen-Day Production for today
    const avgHdep = totalLiveBirds > 0 ? ((todayTotalEggs / totalLiveBirds) * 100).toFixed(1) : 0;

    // 3. Today's Feed Consumption
    const todayConsumptionLogs = await DailyConsumptionLog.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const todayFeedBags = todayConsumptionLogs.reduce((acc, l) => acc + l.bagsConsumed, 0);
    const todayFeedKg = todayConsumptionLogs.reduce((acc, l) => acc + l.totalWeightKg, 0);

    // 4. Commercial Accounting Sales & Expenses (from AccountingTransaction ledger)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayTransactions = await AccountingTransaction.find({
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    const todaySalesRevenue = todayTransactions
      .filter((t) => t.type === 'SALE' || t.type === 'OTHER_INCOME')
      .reduce((acc, t) => acc + (t.amountPaid || t.amount || 0), 0);

    const todayOperatingExpenses = todayTransactions
      .filter((t) => t.type === 'EXPENSE' || t.type === 'ASSET_PURCHASE' || t.type === 'PAYROLL_PAYMENT')
      .reduce((acc, t) => acc + (t.amountPaid || t.amount || 0), 0);

    const todayNetProfit = todaySalesRevenue - todayOperatingExpenses;

    // 5. Recent Production Logs (Last 5)
    const recentLogs = await DailyProductionLog.find({})
      .populate('penId')
      .sort({ date: -1 })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPens: pens.length,
          totalCapacity,
          totalLiveBirds,
          todayTotalEggs,
          todayCrates,
          todayLoose,
          todayGoodEggs,
          todayDamagedEggs,
          todayMortality,
          todayFeedBags,
          todayFeedKg,
          todaySalesRevenue,
          todayOperatingExpenses,
          todayNetProfit,
          avgHdep: Number(avgHdep)
        },
        pensSummary: pens,
        recentLogs
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
