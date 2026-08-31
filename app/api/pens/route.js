import dbConnect from '@/lib/db';
import Pen from '@/models/Pen';
import Flock from '@/models/Flock';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await dbConnect();
    const pens = await Pen.find({}).populate('flockId').sort({ createdAt: -1 });
    
    // Calculate assigned flock count per pen
    const flocks = await Flock.find({ status: { $ne: 'sold' } });
    
    const pensWithFlockCount = pens.map((pen) => {
      const penObj = pen.toObject();
      const assignedFlocks = flocks.filter((f) => f.penId && f.penId.toString() === pen._id.toString());
      const liveBirdCount = assignedFlocks.reduce((sum, f) => sum + (f.current_bird_count || 0), 0);
      
      penObj.current_bird_count = liveBirdCount;
      penObj.assignedFlockCount = assignedFlocks.length;
      penObj.assignedFlocks = assignedFlocks.map(f => ({ _id: f._id, name: f.name, breed: f.breed, count: f.current_bird_count }));
      penObj.status = liveBirdCount > 0 ? 'active' : 'empty';
      return penObj;
    });

    return NextResponse.json({ success: true, data: pensWithFlockCount });
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
