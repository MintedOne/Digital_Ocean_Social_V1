import { NextRequest, NextResponse } from 'next/server';
import { createDropboxIntegration } from '@/lib/dropbox/integration';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Dropbox API connection and token status...');
    
    // Create Dropbox integration instance
    const dropbox = createDropboxIntegration();
    
    // Test connection
    const connectionResult = await dropbox.testConnection();
    
    if (connectionResult.success) {
      console.log('✅ Dropbox connection successful');
      return NextResponse.json({
        success: true,
        message: 'Dropbox connection working',
        account: connectionResult.accountInfo,
        tokenStatus: 'valid'
      });
    } else {
      console.error('❌ Dropbox connection failed:', connectionResult.error);
      
      // Check if it's a token expiration issue
      const isTokenExpired = connectionResult.error?.includes('invalid_access_token') || 
                            connectionResult.error?.includes('expired_access_token') ||
                            connectionResult.error?.includes('unauthorized');
      
      return NextResponse.json({
        success: false,
        message: 'Dropbox connection failed',
        error: connectionResult.error,
        tokenStatus: isTokenExpired ? 'expired' : 'error',
        needsRefresh: isTokenExpired
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('❌ Dropbox test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Dropbox test failed',
      error: error.message,
      tokenStatus: 'error'
    }, { status: 500 });
  }
}