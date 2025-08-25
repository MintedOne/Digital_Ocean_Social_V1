import { NextRequest, NextResponse } from 'next/server';
import { GmailAPISender } from '@/lib/auth/gmail-api-sender';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Gmail API email service...');
    
    const emailSender = new GmailAPISender();
    
    // Check if configured
    console.log('🔧 Checking if Gmail API service is configured...');
    if (!emailSender.isConfigured()) {
      console.log('❌ Gmail API service not configured');
      return NextResponse.json({
        success: false,
        error: 'Gmail API service not configured'
      }, { status: 500 });
    }
    
    console.log('✅ Gmail API service is configured');
    console.log('📧 Attempting to send test admin notification via Gmail API...');
    
    try {
      // Test sending admin notification
      const success = await emailSender.sendAdminNotification(
        'test@example.com', 
        'Test User via Gmail API'
      );
      
      console.log(`📧 Gmail API email send result: ${success}`);
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Test email sent successfully via Gmail API! Check info@mintedyachts.com inbox.'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Failed to send test email via Gmail API - success was false but no exception'
        }, { status: 500 });
      }
    } catch (emailError) {
      console.error('❌ Gmail API email sending failed with exception:', emailError);
      return NextResponse.json({
        success: false,
        error: `Gmail API email sending failed: ${emailError instanceof Error ? emailError.message : 'Unknown email error'}`
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Gmail API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}