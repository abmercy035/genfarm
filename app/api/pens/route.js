import dbConnect from '@/lib/db';
import Pen from '@/models/Pen';
import Flock from '@/models/Flock';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await dbConnect();
    const pens = await Pen.find({}).populate('flockId').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: pens });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, type, location, capacity, current_bird_count, notes } = body;

    if (!name || capacity === undefined || current_bird_count === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, capacity, and current bird count are required.' },
        { status: 400 }
      );
    }

    const pen = await Pen.create({
      name,
      type: type || 'Layers',
      location: location || 'Main Complex',
      capacity: Number(capacity),
      current_bird_count: Number(current_bird_count),
      notes
    });

    return NextResponse.json({ success: true, data: pen }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
