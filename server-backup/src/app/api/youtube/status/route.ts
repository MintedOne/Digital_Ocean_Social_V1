import { NextRequest, NextResponse } from 'next/server';
import { youtubeAuth } from '@/lib/youtube/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking YouTube authentication status...');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Authentication check timed out')), 5000)
    );
    
    const authStatusPromise = youtubeAuth.getAuthStatus();
    
    // Race between auth check and timeout
    const authStatus = await Promise.race([authStatusPromise, timeoutPromise]) as any;
    
    return NextResponse.json({
      success: true,
      ...authStatus
    });

  } catch (error: any) {
    console.error('❌ Auth status check failed:', error);
    
    // On timeout or network error, return not authenticated to show sign-in
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      return NextResponse.json({
        success: true,
        authenticated: false,
        needsAuth: true,
        message: 'Authentication check timed out. Please sign in.'
      });
    }
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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