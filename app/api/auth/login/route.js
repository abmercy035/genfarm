import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await dbConnect();
    const { identifier, phone, email, password } = await request.json();
    const loginInput = identifier || email || phone;

    if (!loginInput || !password) {
      return NextResponse.json({ success: false, error: 'Email/Phone and password are required.' }, { status: 400 });
    }

    const cleanInput = loginInput.trim();
    const user = await User.findOne({
      $or: [
        { phone: cleanInput },
        { email: cleanInput.toLowerCase() }
      ]
    }).select('+password +role +isActive');

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'Invalid email/phone or account inactive.' }, { status: 401 });
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
    
    // Set secure HTTP-only cookie
    response.cookies.set('genfarm_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
