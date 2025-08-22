import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout', 
  '/api/auth/status',
  '/api/test-email', // Test email endpoint
  '/api/test-auth', // Test auth endpoint
  '/api/test-gmail-api', // Test Gmail API endpoint
  '/api/admin', // Admin API routes handle their own authentication
  '/_next',
  '/favicon.ico',
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Allow public paths
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return NextResponse.next();
  }
  
  // Check for session cookie (simple check - detailed validation happens server-side)
  const sessionCookie = request.cookies.get('minted-yachts-session');
  
  // If no session cookie, redirect to login
  if (!sessionCookie?.value) {
    console.log(`🔒 Middleware: Redirecting ${path} to /login - No session cookie`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Session cookie exists - let the request through (server-side will validate)
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