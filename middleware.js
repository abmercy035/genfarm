import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

const ADMIN_ONLY_ROUTES = ['/users', '/pricing', '/valuation'];
const AUTHENTICATED_ROUTES = ['/', '/production', '/consumption', '/pens', '/accountant', '/analytics', '/forecasting', '/users', '/pricing', '/valuation'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip static assets, Next.js internal files, and public APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // Check auth token cookie
  const token = request.cookies.get('genfarm_token')?.value;
  const user = token ? verifyToken(token) : null;

  // 1. Unauthenticated users trying to access protected pages
  if (!user && AUTHENTICATED_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Role-Based Access Control (RBAC): Non-Admin users trying to access Admin-Only pages
  if (user && ADMIN_ONLY_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`))) {
    const role = user.role;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    if (!isAdmin) {
      // Redirect regular workers trying to access /users, /pricing, or /valuation back to /
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
