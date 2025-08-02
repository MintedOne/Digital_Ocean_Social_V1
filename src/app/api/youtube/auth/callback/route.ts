import { NextRequest, NextResponse } from 'next/server';
import { youtubeAuth } from '@/lib/youtube/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Processing YouTube OAuth callback...');
    
    const code = request.nextUrl.searchParams.get('code');
    const error = request.nextUrl.searchParams.get('error');
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:3000';

    // Handle OAuth errors
    if (error) {
      console.error('❌ OAuth error:', error);
      const errorMessage = error === 'access_denied' 
        ? 'Access denied. Please grant permissions to upload videos.'
        : `Authentication error: ${error}`;
      
      return NextResponse.redirect(
        new URL(`/video-generator?auth_error=${encodeURIComponent(errorMessage)}`, baseUrl)
      );
    }

    // Handle missing authorization code
    if (!code) {
      console.error('❌ No authorization code received');
      return NextResponse.redirect(
        new URL('/video-generator?auth_error=No authorization code received', baseUrl)
      );
    }

    // Exchange code for tokens
    await youtubeAuth.exchangeCodeForTokens(code);
    
    console.log('✅ YouTube authentication successful');
    
    // Redirect back to video generator with success message
    return NextResponse.redirect(
      new URL('/video-generator?auth_success=true', baseUrl)
    );

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Authentication failed';
    
    const baseUrl = new URL(request.url).origin;
    
    return NextResponse.redirect(
      new URL(`/video-generator?auth_error=${encodeURIComponent(errorMessage)}`, baseUrl)
    );
  }
}

export const runtime = 'nodejs';