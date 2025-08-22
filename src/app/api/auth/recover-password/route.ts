import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/auth/user-database';
import { GmailAPISender } from '@/lib/auth/gmail-api-sender';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await findUserByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, you will receive password recovery instructions.'
      });
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      // Regular users should use the password setup flow
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, you will receive password recovery instructions.'
      });
    }
    
    // Send admin password recovery email
    try {
      const emailSender = new GmailAPISender();
      await emailSender.sendAdminPasswordRecovery(
        user.email,
        user.displayName || user.email
      );
      
      console.log(`📧 Admin password recovery sent to: ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password recovery email:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send recovery email. Please try again later.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password recovery instructions have been sent to your email.'
    });
  } catch (error) {
    console.error('Password recovery error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process password recovery' 
      },
      { status: 500 }
    );
  }
}