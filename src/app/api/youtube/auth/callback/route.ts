import { NextRequest, NextResponse } from 'next/server';
import { youtubeAuth } from '@/lib/youtube/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Processing YouTube OAuth callback...');
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('❌ OAuth error:', error);
      const errorMessage = error === 'access_denied' 
        ? 'Access denied. Please grant permissions to upload videos.'
        : `Authentication error: ${error}`;
      
      return NextResponse.redirect(
        new URL(`/video-generator?auth_error=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }

    // Handle missing authorization code
    if (!code) {
      console.error('❌ No authorization code received');
      return NextResponse.redirect(
        new URL('/video-generator?auth_error=No authorization code received', request.url)
      );
    }

    // Exchange code for tokens
    await youtubeAuth.exchangeCodeForTokens(code);
    
    console.log('✅ YouTube authentication successful');
    
    // Redirect back to video generator with success message
    return NextResponse.redirect(
      new URL('/video-generator?auth_success=true', request.url)
    );

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Authentication failed';
    
    return NextResponse.redirect(
      new URL(`/video-generator?auth_error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}

export const runtime = 'nodejs';