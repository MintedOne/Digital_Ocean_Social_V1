import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { destroySession, getCurrentSession } from '@/lib/auth/session-manager';
import { logActivity } from '@/lib/auth/activity-logger';
import { getUserDisplayName } from '@/lib/auth/user-display-utils';

export async function POST(request: NextRequest) {
  try {
    // Get current session before destroying it
    const user = await getCurrentSession();
    
    // Destroy session
    await destroySession();
    
    // Log logout activity if user was logged in
    if (user) {
      try {
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        
        await logActivity(
          user.email,
          'logout',
          {
            userName: getUserDisplayName(user),
            userId: user.id,
            ipAddress,
            userAgent,
            details: 'User logged out'
          }
        );
      } catch (logError) {
        console.error('Failed to log logout activity:', logError);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to logout',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Support GET for simple logout links
  try {
    // Get current session before destroying it
    const user = await getCurrentSession();
    
    // Destroy session
    await destroySession();
    
    // Log logout activity if user was logged in
    if (user) {
      try {
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        
        await logActivity(
          user.email,
          'logout',
          {
            userName: getUserDisplayName(user),
            userId: user.id,
            ipAddress,
            userAgent,
            details: 'User logged out via GET'
          }
        );
      } catch (logError) {
        console.error('Failed to log logout activity:', logError);
      }
    }
    
    // Get the base URL from the request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    // Return redirect response
    return NextResponse.redirect(new URL('/login', baseUrl));
  } catch (error) {
    console.error('Error during logout:', error);
    // Still redirect even on error
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    return NextResponse.redirect(new URL('/login', baseUrl));
  }
}