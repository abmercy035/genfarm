import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await dbConnect();

    // Check token from HTTP Cookie or Bearer header
    const token = request.cookies.get('genfarm_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    const user = await User.findById(decoded.id).select('_id name phone email role isActive');
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'User account disabled or not found' }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
