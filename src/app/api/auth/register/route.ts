import { NextRequest, NextResponse } from 'next/server';
import { validateEmail, generateDisplayName } from '@/lib/auth/email-validator';
import { 
  findUserByEmail, 
  createUser, 
  initializeDatabase 
} from '@/lib/auth/user-database';
import { GmailAPISender } from '@/lib/auth/gmail-api-sender';

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();
    
    const { email, firstName, lastName, phoneNumber } = await request.json();
    
    // Validate email
    const validation = validateEmail(email);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please try signing in instead.' },
        { status: 409 }
      );
    }
    
    // Generate display name from email
    const displayName = generateDisplayName(email);
    
    // Create new user with additional fields
    const user = await createUser(
      email, 
      displayName, 
      'user', 
      'pending', 
      firstName, 
      lastName, 
      phoneNumber
    );
    
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
        await emailSender.sendAdminNotification(email, displayName);
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
    
    return NextResponse.json({ 
      success: true, 
      message: 'Your account has been created and is pending approval. An administrator will review your request and send you an email with instructions to set your password.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      },
      { status: 500 }
    );
  }
}