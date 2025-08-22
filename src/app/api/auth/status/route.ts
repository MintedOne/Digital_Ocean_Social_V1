import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session-manager';

export async function GET() {
  try {
    const user = await getCurrentSession();
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Failed to check authentication status',
      },
      { status: 500 }
    );
  }
}