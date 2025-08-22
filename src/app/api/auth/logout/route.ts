import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { destroySession } from '@/lib/auth/session-manager';

export async function POST() {
  try {
    await destroySession();
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
    await destroySession();
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