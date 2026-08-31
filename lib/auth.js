import jwt from 'jsonwebtoken';
import User from '@/models/User';
import dbConnect from '@/lib/db';

export const ROLES = {
  WORKER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3
};

const JWT_SECRET = process.env.JWT_SECRET || 'genfarm_super_secret_jwt_key_2026';

export function signToken(user) {
  return jwt.sign(
    { 
      id: user._id, 
      name: user.name, 
      phone: user.phone, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function authenticate(request) {
  await dbConnect();
  
  // Extract from Auth Header or Cookie
  let token = null;
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/genfarm_token=([^;]+)/);
      if (match) token = match[1];
    }
  }

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = await User.findById(decoded.id).select('+role +isActive');
  if (!user || !user.isActive) return null;

  return user;
}

export function authorizeMinRole(user, requiredRole) {
  if (!user) return false;
  const userLevel = ROLES[user.role] || 0;
  const targetLevel = ROLES[requiredRole] || 99;
  return userLevel >= targetLevel;
}
