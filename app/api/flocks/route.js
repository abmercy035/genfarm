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
      const existingPen = await Pen.findById(penId);
      if (existingPen && existingPen.flockId) {
        // Unassign old flock from this pen
        await Flock.findByIdAndUpdate(existingPen.flockId, { penId: null, status: 'unassigned' });
      }

      await Pen.findByIdAndUpdate(penId, { 
        flockId: flock._id, 
        current_bird_count: Number(initial_bird_count),
        status: 'active'
      });
    }

    return NextResponse.json({ success: true, data: flock }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
