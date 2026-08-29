import dbConnect from '@/lib/db';
import Pen from '@/models/Pen';
import Flock from '@/models/Flock';
import { NextResponse } from 'next/server';

export async function GET(request, context) {
  try {
    await dbConnect();
    const params = await context.params;
    const id = params?.id;
    const pen = await Pen.findById(id).populate('flockId');
    if (!pen) return NextResponse.json({ success: false, error: 'Pen not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: pen });
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
    const pen = await Pen.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!pen) return NextResponse.json({ success: false, error: 'Pen not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: pen });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    await dbConnect();
    const params = await context.params;
    const id = params?.id;
    if (!id) return NextResponse.json({ success: false, error: 'No Pen ID provided' }, { status: 400 });

    const pen = await Pen.findByIdAndDelete(id);
    if (!pen) return NextResponse.json({ success: false, error: 'Pen not found' }, { status: 404 });

    // Clear reference on linked flock
    await Flock.updateMany({ penId: id }, { penId: null, status: 'unassigned' });

    return NextResponse.json({ success: true, data: pen });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
