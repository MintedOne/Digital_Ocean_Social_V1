import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { promises as fs } from 'fs';
import { join } from 'path';

const CREDENTIALS_PATH = join(process.cwd(), 'config', 'youtube-credentials.json');

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing OAuth authentication...');
    
    // Initialize OAuth2Client
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/auth/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: false,
        error: 'OAuth credentials not found in environment'
      }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Load credentials
    const credentialsData = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(credentialsData);

    oauth2Client.setCredentials({
      refresh_token: credentials.refresh_token,
      access_token: credentials.access_token,
      token_type: credentials.token_type,
      expiry_date: credentials.expiry_date
    });

    // Get user info using OAuth2
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    console.log('✅ Authenticated user info:', userInfo.data);

    return NextResponse.json({
      success: true,
      userInfo: userInfo.data
    });

  } catch (error) {
    console.error('❌ Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}