import { NextRequest, NextResponse } from 'next/server';
import { validateEmail } from '@/lib/auth/email-validator';
import { 
  findUserByEmail, 
  createUser, 
  initializeDatabase 
} from '@/lib/auth/user-database';
import { createSession } from '@/lib/auth/session-manager';
import { validateUserCredentials } from '@/lib/auth/password-manager';
import { GoogleEmailSender } from '@/lib/auth/google-email-sender';

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();
    
    const { email, displayName, password } = await request.json();
    
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
      // For new users, create account and send admin notification
      user = await createUser(email, displayName);
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Failed to create user account' },
          { status: 500 }
        );
      }
      
      // Send admin notification email for new user
      try {
        const emailSender = new GoogleEmailSender();
        if (emailSender.isConfigured()) {
          await emailSender.sendAdminNotification(email, displayName || email);
          console.log(`📧 Admin notification sent for new user: ${email}`);
        } else {
          console.log(`⚠️ Email service not configured. Admin notification for ${email} not sent.`);
          console.log(`ℹ️ To enable email notifications, configure Google OAuth with Gmail permissions.`);
        }
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
        console.log(`⚠️ Email notification failed for ${email}. Admin can check pending users in /admin portal.`);
        // Continue even if email fails
      }
      
      // New users are pending and cannot login yet
      return NextResponse.json(
        { 
          success: false, 
          error: 'Your account has been created and is pending approval. An administrator will review your request soon.',
          requiresApproval: true 
        },
        { status: 403 }
      );
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
        { 
          success: false, 
          error: 'Your account is pending approval. Please wait for an administrator to approve your account.',
          requiresApproval: true 
        },
        { status: 403 }
      );
    }
    
    if (user.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Your account status is invalid. Please contact an administrator.' },
        { status: 403 }
      );
    }
    
    // For approved users, validate password
    if (!password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password is required',
          requiresPassword: true 
        },
        { status: 400 }
      );
    }
    
    // Validate credentials with password
    const validatedUser = await validateUserCredentials(email, password);
    
    if (!validatedUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Create session for authenticated user
    await createSession(validatedUser);
    
    return NextResponse.json({ 
      success: true, 
      user: {
        email: validatedUser.email,
        displayName: validatedUser.displayName,
        role: validatedUser.role
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