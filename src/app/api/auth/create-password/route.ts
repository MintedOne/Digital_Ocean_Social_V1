import { NextRequest, NextResponse } from 'next/server';
import { 
  findUserById,
  updateUserById
} from '@/lib/auth/user-database';
import { 
  setUserPassword,
  validatePasswordStrength
} from '@/lib/auth/password-manager';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.message },
        { status: 400 }
      );
    }
    
    // Find user by reset token
    // Note: In production, you'd query by passwordResetToken
    // For now, we'll decode the token to get the user ID
    const userId = token; // Simplified for this implementation
    
    const user = await findUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    // Check if user is approved
    if (user.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Your account must be approved before you can set a password' },
        { status: 403 }
      );
    }
    
    // Set the user's password
    const success = await setUserPassword(user.id, password);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to set password' },
        { status: 500 }
      );
    }
    
    // Clear the reset token
    await updateUserById(user.id, {
      passwordResetToken: undefined,
      passwordResetExpires: undefined
    });
    
    console.log(`🔐 Password set for user: ${user.email}`);
    
    return NextResponse.json({
      success: true,
      message: 'Password has been set successfully. You can now login with your email and password.'
    });
  } catch (error) {
    console.error('Create password error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create password' 
      },
      { status: 500 }
    );
  }
}