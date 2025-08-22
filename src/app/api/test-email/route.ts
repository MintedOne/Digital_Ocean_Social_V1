import { NextRequest, NextResponse } from 'next/server';
import { GmailAPISender } from '@/lib/auth/gmail-api-sender';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing email service...');
    
    const emailSender = new GmailAPISender();
    
    // Check if configured
    console.log('🔧 Checking if email service is configured...');
    if (!emailSender.isConfigured()) {
      console.log('❌ Email service not configured');
      return NextResponse.json({
        success: false,
        error: 'Email service not configured'
      }, { status: 500 });
    }
    
    console.log('✅ Email service is configured');
    console.log('📧 Attempting to send test admin notification...');
    
    try {
      // Test sending admin notification
      const success = await emailSender.sendAdminNotification(
        'test@example.com', 
        'Test User'
      );
      
      console.log(`📧 Email send result: ${success}`);
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Test email sent successfully'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Failed to send test email - success was false but no exception'
        }, { status: 500 });
      }
    } catch (emailError) {
      console.error('❌ Email sending failed with exception:', emailError);
      return NextResponse.json({
        success: false,
        error: `Email sending failed: ${emailError instanceof Error ? emailError.message : 'Unknown email error'}`
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Test email error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}