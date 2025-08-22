import { NextRequest, NextResponse } from 'next/server';
import { findUserById, updateUserById } from '@/lib/auth/user-database';
import { hashPassword } from '@/lib/auth/password-manager';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      );
    }
    
    // Find user by reset token
    const { getAllUsers } = await import('@/lib/auth/user-database');
    const users = await getAllUsers();
    const user = users.find(u => 
      u.passwordResetToken === token && 
      u.passwordResetExpires && 
      new Date(u.passwordResetExpires) > new Date()
    );
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Hash the password
    const passwordHash = await hashPassword(password);
    
    // Update user with new password and clear reset token
    await updateUserById(user.id, {
      passwordHash,
      passwordResetToken: undefined,
      passwordResetExpires: undefined
    });
    
    console.log(`✅ Password set for user: ${user.email}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Password set successfully! You can now login with your new password.',
      email: user.email
    });
    
  } catch (error) {
    console.error('Setup password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set password' },
      { status: 500 }
    );
  }
}

// GET method to verify token validity
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Find user by reset token
    const { getAllUsers } = await import('@/lib/auth/user-database');
    const users = await getAllUsers();
    const user = users.find(u => 
      u.passwordResetToken === token && 
      u.passwordResetExpires && 
      new Date(u.passwordResetExpires) > new Date()
    );
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      email: user.email,
      displayName: user.displayName
    });
    
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}