import { NextRequest, NextResponse } from 'next/server';
import { youtubeAuth } from '@/lib/youtube/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking YouTube authentication status...');
    
    const authStatus = await youtubeAuth.getAuthStatus();
    
    return NextResponse.json({
      success: true,
      ...authStatus
    });

  } catch (error) {
    console.error('❌ Auth status check failed:', error);
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'authenticate') {
      console.log('🔗 Generating YouTube authentication URL...');
      
      const authUrl = youtubeAuth.generateAuthUrl();
      
      return NextResponse.json({
        success: true,
        authUrl
      });
      
    } else if (action === 'logout') {
      console.log('🚪 Clearing YouTube credentials...');
      
      await youtubeAuth.clearCredentials();
      
      return NextResponse.json({
        success: true,
        message: 'Logged out successfully'
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Auth action failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';