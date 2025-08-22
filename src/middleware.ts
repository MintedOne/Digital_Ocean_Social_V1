import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSession } from './lib/auth/session-manager';

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout', 
  '/api/auth/status',
  '/_next',
  '/favicon.ico',
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Allow public paths
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return NextResponse.next();
  }
  
  // Check for session cookie and validate it
  const sessionCookie = request.cookies.get('minted-yachts-session');
  const sessionToken = sessionCookie?.value;
  
  // If no session token or invalid session, redirect to login
  if (!sessionToken || !validateSession(sessionToken)) {
    console.log(`🔒 Middleware: Redirecting ${path} to /login - ${!sessionToken ? 'No token' : 'Invalid token'}`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  console.log(`✅ Middleware: Allowing access to ${path} - Valid session`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};