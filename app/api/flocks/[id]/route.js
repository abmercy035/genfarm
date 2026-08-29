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
      // Clear old pen if it referenced this flock
      await Pen.findByIdAndUpdate(oldPenId, { flockId: null, status: 'empty' });
    }

    if (newPenId) {
      // If target new pen had another flock assigned, clear that flock's penId
      const targetPen = await Pen.findById(newPenId);
      if (targetPen && targetPen.flockId && targetPen.flockId.toString() !== id) {
        await Flock.findByIdAndUpdate(targetPen.flockId, { penId: null, status: 'unassigned' });
      }

      await Pen.findByIdAndUpdate(newPenId, { 
        flockId: existingFlock._id, 
        current_bird_count: existingFlock.current_bird_count,
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

    // Unassign pen if linked
    if (flock.penId) {
      await Pen.findByIdAndUpdate(flock.penId, { flockId: null, status: 'empty' });
    }

    return NextResponse.json({ success: true, data: flock });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
