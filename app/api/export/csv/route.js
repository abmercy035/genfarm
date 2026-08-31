import dbConnect from '@/lib/db';
import DailyProductionLog from '@/models/DailyProductionLog';
import DailyConsumptionLog from '@/models/DailyConsumptionLog';
import Pen from '@/models/Pen';
import Flock from '@/models/Flock';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'production';

    let csvContent = '';
    let filename = `genfarm_${type}_report.csv`;

    if (type === 'production') {
      const logs = await DailyProductionLog.find({}).populate('penId').sort({ date: -1 });
      const headers = ['Date', 'Pen Name', 'Good Eggs (pcs)', 'Cracked/Damaged (pcs)', 'Total Eggs', 'Crates (30s)', 'Loose Eggs', 'Mortality', 'Sick/Culls', 'HDEP %', 'Logged By', 'Notes'];
      const rows = logs.map(l => [
        `"${new Date(l.date).toLocaleDateString()}"`,
        `"${l.penId?.name || 'N/A'}"`,
        l.goodEggs,
        l.damagedEggs,
        l.totalEggs,
        l.crates,
        l.looseEggs,
        l.mortality,
        l.culls,
        `"${l.hdepPercentage}%"`,
        `"${l.loggedBy || ''}"`,
        `"${(l.notes || '').replace(/"/g, '""')}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (type === 'consumption') {
      const logs = await DailyConsumptionLog.find({}).populate('penId').sort({ date: -1 });
      const headers = ['Date', 'Pen Name', 'Feed Type', 'Bags Consumed', 'Bag Weight (kg)', 'Total Weight (kg)', 'Water (Liters)', 'Medication/Vaccine', 'Logged By', 'Notes'];
      const rows = logs.map(l => [
        `"${new Date(l.date).toLocaleDateString()}"`,
        `"${l.penId?.name || 'N/A'}"`,
        `"${l.feedType}"`,
        l.bagsConsumed,
        l.bagWeightKg,
        l.totalWeightKg,
        l.waterLiters,
        `"${(l.medicationAdministered || '').replace(/"/g, '""')}"`,
        `"${l.loggedBy || ''}"`,
        `"${(l.notes || '').replace(/"/g, '""')}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (type === 'inventory') {
      const pens = await Pen.find({});
      const flocks = await Flock.find({}).populate('penId');

      const penHeaders = ['Pen Name', 'Location', 'Type', 'Capacity', 'Live Bird Count', 'Occupancy %'];
      const penRows = pens.map(p => [
        `"${p.name}"`,
        `"${p.location}"`,
        `"${p.type}"`,
        p.capacity,
        p.current_bird_count,
        `"${p.capacity > 0 ? Math.round((p.current_bird_count / p.capacity) * 100) : 0}%"`
      ]);

      const flockHeaders = ['\nFlock Name', 'Breed', 'Assigned Pen', 'Initial Count', 'Live Count', 'Age (Weeks)', 'Status'];
      const flockRows = flocks.map(f => [
        `"${f.name}"`,
        `"${f.breed}"`,
        `"${f.penId?.name || 'Unassigned'}"`,
        f.initial_bird_count,
        f.current_bird_count,
        f.ageWeeks,
        `"${f.status}"`
      ]);

      csvContent = [
        '--- HOUSING PENS ---',
        penHeaders.join(','),
        ...penRows.map(r => r.join(',')),
        '',
        '--- REGISTERED FLOCKS ---',
        flockHeaders.join(','),
        ...flockRows.map(r => r.join(','))
      ].join('\n');
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
