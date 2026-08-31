import dbConnect from '@/lib/db';
import Flock from '@/models/Flock';
import Pen from '@/models/Pen';
import { NextResponse } from 'next/server';

export async function GET(request, context) {
  try {
    await dbConnect();
    const params = await context.params;
    const id = params?.id;
    const flock = await Flock.findById(id).populate('penId');
    if (!flock) return NextResponse.json({ success: false, error: 'Flock not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: flock });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    await dbConnect();
    const params = await context.params;
    const id = params?.id;
    const body = await request.json();
    const { name, breed, penId, initial_bird_count, current_bird_count, ageWeeks, status } = body;

    const existingFlock = await Flock.findById(id);
    if (!existingFlock) {
      return NextResponse.json({ success: false, error: 'Flock not found' }, { status: 404 });
    }

    const oldPenId = existingFlock.penId ? existingFlock.penId.toString() : null;
    const newPenId = penId || null;

    // Update flock properties
    existingFlock.name = name !== undefined ? name : existingFlock.name;
    existingFlock.breed = breed !== undefined ? breed : existingFlock.breed;
    existingFlock.penId = newPenId;
    if (initial_bird_count !== undefined) existingFlock.initial_bird_count = Number(initial_bird_count);
    if (current_bird_count !== undefined) existingFlock.current_bird_count = Number(current_bird_count);
    if (ageWeeks !== undefined) existingFlock.ageWeeks = Number(ageWeeks);
    if (status !== undefined) existingFlock.status = status;

    await existingFlock.save();

    // Reassignment logic for Pens
    if (oldPenId && oldPenId !== newPenId) {
      // Recalculate old pen total
      const oldPenFlocks = await Flock.find({ penId: oldPenId, status: { $ne: 'sold' } });
      const oldTotal = oldPenFlocks.reduce((sum, f) => sum + (f.current_bird_count || 0), 0);
      await Pen.findByIdAndUpdate(oldPenId, {
        current_bird_count: oldTotal,
        status: oldPenFlocks.length > 0 ? 'active' : 'empty'
      });
    }

    if (newPenId) {
      // Recalculate new pen total
      const newPenFlocks = await Flock.find({ penId: newPenId, status: { $ne: 'sold' } });
      const newTotal = newPenFlocks.reduce((sum, f) => sum + (f.current_bird_count || 0), 0);
      await Pen.findByIdAndUpdate(newPenId, { 
        flockId: existingFlock._id, 
        current_bird_count: newTotal,
        status: 'active'
      });
    }

    return NextResponse.json({ success: true, data: existingFlock });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    await dbConnect();
    const params = await context.params;
    const id = params?.id;
    if (!id) return NextResponse.json({ success: false, error: 'No Flock ID provided' }, { status: 400 });

    const flock = await Flock.findByIdAndDelete(id);
    if (!flock) return NextResponse.json({ success: false, error: 'Flock not found' }, { status: 404 });

    // Update target pen current_bird_count if linked
    if (flock.penId) {
      const remainingFlocks = await Flock.find({ penId: flock.penId, _id: { $ne: id }, status: { $ne: 'sold' } });
      const newTotal = remainingFlocks.reduce((sum, f) => sum + (f.current_bird_count || 0), 0);
      await Pen.findByIdAndUpdate(flock.penId, {
        current_bird_count: newTotal,
        status: remainingFlocks.length > 0 ? 'active' : 'empty',
        flockId: remainingFlocks.length > 0 ? remainingFlocks[0]._id : null
      });
    }

    return NextResponse.json({ success: true, data: flock });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
