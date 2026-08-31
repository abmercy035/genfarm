import dbConnect from '@/lib/db';
import User from '@/models/User';
import { authenticate, authorizeMinRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await dbConnect();
    const user = await authenticate(request);
    if (!user || !authorizeMinRole(user, 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const users = await User.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const currentUser = await authenticate(request);
    if (!currentUser || !authorizeMinRole(currentUser, 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Access denied: Super Admin required to create accounts.' }, { status: 403 });
    }

    const { name, phone, password, role = 'WORKER', assignedPens } = await request.json();

    if (!name || !phone || !password) {
      return NextResponse.json({ success: false, error: 'Name, phone, and password required.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      phone,
      password: hashedPassword,
      role,
      assignedPens: assignedPens || []
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
