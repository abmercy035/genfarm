import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await dbConnect();
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ success: false, error: 'Phone and password are required.' }, { status: 400 });
    }

    let user = await User.findOne({ phone }).select('+password +role +isActive');
    
    // Auto-bootstrap initial Super Admin account in production if database is fresh/empty
    if (!user) {
      const userCount = await User.countDocuments({});
      if (userCount === 0) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await User.create([
          {
            name: 'General Manager',
            phone: '08000000001',
            email: 'admin@genfarm.com',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            isActive: true
          }
        ]);
        user = await User.findOne({ phone }).select('+password +role +isActive');
      }
    }

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'Invalid phone number or account inactive.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = signToken(user);
    const userData = {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role
    };

    const response = NextResponse.json({ success: true, data: userData, token });
    
    // Set HTTP cookie
    response.cookies.set('genfarm_token', token, {
      httpOnly: false,
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
