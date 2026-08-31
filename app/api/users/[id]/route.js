import dbConnect from '@/lib/db';
import User from '@/models/User';
import { authenticate, authorizeMinRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function PUT(request, context) {
  try {
    await dbConnect();
    const currentUser = await authenticate(request);
    if (!currentUser || !authorizeMinRole(currentUser, 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Access denied: Admin permissions required.' }, { status: 403 });
    }

    const params = await context.params;
    const id = params?.id;
    const { name, phone, password, role, isActive } = await request.json();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    if (name) targetUser.name = name;
    if (phone) targetUser.phone = phone;
    if (role) targetUser.role = role;
    if (typeof isActive === 'boolean') targetUser.isActive = isActive;
    if (password && password.trim() !== '') {
      targetUser.password = await bcrypt.hash(password, 10);
    }

    await targetUser.save();
    return NextResponse.json({ success: true, data: targetUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    await dbConnect();
    const currentUser = await authenticate(request);
    if (!currentUser || !authorizeMinRole(currentUser, 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Access denied: Admin permissions required.' }, { status: 403 });
    }

    const params = await context.params;
    const id = params?.id;

    // Prevent deleting self
    if (currentUser._id.toString() === id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own admin account.' }, { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User account deleted.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
