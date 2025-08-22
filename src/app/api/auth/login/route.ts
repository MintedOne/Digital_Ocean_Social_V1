import { NextRequest, NextResponse } from 'next/server';
import { validateEmail } from '@/lib/auth/email-validator';
import { 
  findUserByEmail, 
  createUser, 
  initializeDatabase 
} from '@/lib/auth/user-database';
import { createSession } from '@/lib/auth/session-manager';

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();
    
    const { email, displayName } = await request.json();
    
    // Validate email
    const validation = validateEmail(email);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    // Check if user exists
    let user = await findUserByEmail(email);
    
    if (!user) {
      // Create new user if they don't exist
      user = await createUser(email, displayName);
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Failed to create user account' },
          { status: 500 }
        );
      }
    }
    
    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Your account has been deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }
    
    // Check user status
    if (user.status === 'blocked') {
      return NextResponse.json(
        { success: false, error: 'Your account has been blocked. Please contact an administrator.' },
        { status: 403 }
      );
    }
    
    if (user.status === 'pending') {
      return NextResponse.json(
        { success: false, error: 'Your account is pending approval. Please contact an administrator.' },
        { status: 403 }
      );
    }
    
    if (user.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Your account status is invalid. Please contact an administrator.' },
        { status: 403 }
      );
    }
    
    // Create session
    await createSession(user);
    
    return NextResponse.json({ 
      success: true, 
      user: {
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      },
      { status: 500 }
    );
  }
}