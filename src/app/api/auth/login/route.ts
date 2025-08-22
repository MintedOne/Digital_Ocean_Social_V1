import { NextRequest, NextResponse } from 'next/server';
import { validateEmail } from '@/lib/auth/email-validator';
import { 
  findUserByEmail, 
  createUser, 
  initializeDatabase 
} from '@/lib/auth/user-database';
import { createSession } from '@/lib/auth/session-manager';
import { validateUserCredentials } from '@/lib/auth/password-manager';
import { GmailAPISender } from '@/lib/auth/gmail-api-sender';
import { getUserDisplayName } from '@/lib/auth/user-display-utils';
import { logActivity } from '@/lib/auth/activity-logger';
import { updateLastLogin } from '@/lib/auth/user-database';

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Extract request context for activity logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const { email, displayName, password } = await request.json();
    
    // Validate email
    const validation = validateEmail(email);
    if (!validation.isValid) {
      // Log failed login attempt for invalid email
      try {
        await logActivity(
          email,
          'login_failed',
          {
            ipAddress,
            userAgent,
            details: 'Invalid email domain'
          }
        );
      } catch (logError) {
        console.error('Failed to log invalid email attempt:', logError);
      }
      
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
        const emailSender = new GmailAPISender();
        if (emailSender.isConfigured()) {
          await emailSender.sendAdminNotification(email, getUserDisplayName(user));
          console.log(`📧 Admin notification sent for new user: ${email} via Gmail API`);
        } else {
          console.log(`⚠️ Gmail API service not configured. Admin notification for ${email} not sent.`);
          console.log(`ℹ️ To enable email notifications, configure Google OAuth with Gmail permissions.`);
        }
      } catch (emailError) {
        console.error('Failed to send admin notification via Gmail API:', emailError);
        if (emailError instanceof Error && emailError.message.includes('re-authenticate')) {
          console.log(`⚠️ YouTube OAuth needs re-authentication to include Gmail permissions.`);
          console.log(`ℹ️ Go to YouTube settings page and re-authenticate to enable email notifications.`);
        } else {
          console.log(`⚠️ Gmail API notification failed for ${email}. Admin can check pending users in /admin portal.`);
        }
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
      // Log failed login attempt for invalid credentials
      try {
        await logActivity(
          email,
          'login_failed',
          {
            userName: getUserDisplayName(user),
            userId: user.id,
            ipAddress,
            userAgent,
            details: 'Invalid password'
          }
        );
      } catch (logError) {
        console.error('Failed to log invalid credentials attempt:', logError);
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Create session for authenticated user
    await createSession(validatedUser);
    
    // Update last login time
    await updateLastLogin(validatedUser.id);
    
    // Log successful login
    try {
      await logActivity(
        validatedUser.email,
        'login_success',
        {
          userName: getUserDisplayName(validatedUser),
          userId: validatedUser.id,
          ipAddress,
          userAgent,
          details: 'User logged in successfully'
        }
      );
    } catch (logError) {
      console.error('Failed to log successful login:', logError);
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: validatedUser.id,
        email: validatedUser.email,
        displayName: validatedUser.displayName,
        firstName: validatedUser.firstName,
        lastName: validatedUser.lastName,
        phoneNumber: validatedUser.phoneNumber,
        address: validatedUser.address,
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