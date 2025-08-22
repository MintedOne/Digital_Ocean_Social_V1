import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { promises as fs } from 'fs';
import { join } from 'path';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/gmail.send'
];

const CREDENTIALS_PATH = join(process.cwd(), 'config', 'youtube-credentials.json');

interface YouTubeCredentials {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expiry_date?: number;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export class YouTubeAuthenticator {
  private oauth2Client: OAuth2Client | null = null;
  private youtube: any = null;

  constructor() {
    // Don't initialize immediately - wait for first use
  }

  private initializeOAuth2Client() {
    if (this.oauth2Client) {
      return; // Already initialized
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/auth/callback';

    if (!clientId || !clientSecret) {
      throw new Error('YouTube OAuth2 credentials not found in environment variables');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  /**
   * Generate OAuth2 authorization URL for first-time authentication
   */
  generateAuthUrl(): string {
    this.initializeOAuth2Client();

    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Critical: Gets refresh token
      scope: SCOPES,
      prompt: 'consent' // Force consent for refresh token
    });
  }

  /**
   * Exchange authorization code for tokens and save credentials
   */
  async exchangeCodeForTokens(code: string): Promise<void> {
    this.initializeOAuth2Client();

    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      console.log('🔄 Exchanging authorization code for tokens...');
      const { tokens } = await this.oauth2Client.getToken(code);
      
      // Save credentials with ALL token data
      const credentials: YouTubeCredentials = {
        access_token: tokens.access_token || '',
        refresh_token: tokens.refresh_token || '', // Critical for auto-refresh
        token_type: tokens.token_type || 'Bearer',
        expiry_date: tokens.expiry_date || 0,
        client_id: process.env.YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        redirect_uri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/auth/callback'
      };

      await this.saveCredentials(credentials);
      this.oauth2Client.setCredentials(tokens);
      
      console.log('✅ Tokens saved successfully');
    } catch (error) {
      console.error('❌ Token exchange failed:', error);
      throw new Error(`Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize authentication with automatic token refresh
   */
  async initializeAuth(): Promise<boolean> {
    try {
      this.initializeOAuth2Client();
      
      console.log('🔐 Initializing YouTube authentication...');
      
      // Load stored credentials
      const credentials = await this.loadCredentials();
      if (!credentials) {
        console.log('⚠️ No stored credentials found');
        return false;
      }

      // Set credentials
      this.oauth2Client!.setCredentials({
        refresh_token: credentials.refresh_token,
        access_token: credentials.access_token,
        token_type: credentials.token_type,
        expiry_date: credentials.expiry_date
      });

      // Test current token by making a simple API call
      if (this.oauth2Client) {
        this.youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
      }
      await this.youtube.channels.list({ part: 'snippet', mine: true });
      
      console.log('✅ Authentication successful');
      return true;

    } catch (error: any) {
      console.log('⚠️ Token validation failed, attempting refresh...');
      
      // Handle token refresh
      if (error.message?.includes('invalid_grant') || 
          error.message?.includes('Token has been expired') ||
          error.code === 401) {
        
        return await this.refreshToken();
      }
      
      console.error('❌ Authentication failed:', error);
      return false;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshToken(): Promise<boolean> {
    try {
      console.log('🔄 Refreshing access token...');
      
      const { credentials: newCreds } = await this.oauth2Client!.refreshAccessToken();
      
      // Load existing credentials to preserve refresh_token and other data
      const existingCredentials = await this.loadCredentials();
      if (!existingCredentials) {
        throw new Error('No existing credentials found for refresh');
      }

      // Update credentials with new access token
      const updatedCredentials: YouTubeCredentials = {
        ...existingCredentials,
        access_token: newCreds.access_token || '',
        token_type: newCreds.token_type || 'Bearer',
        expiry_date: newCreds.expiry_date || 0
      };

      await this.saveCredentials(updatedCredentials);
      this.oauth2Client!.setCredentials(newCreds);
      
      // Re-initialize YouTube API with new token
      if (this.oauth2Client) {
        this.youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
      }
      
      console.log('✅ Token refresh successful');
      return true;

    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Get authenticated YouTube API instance
   */
  getYouTubeAPI(): any {
    if (!this.youtube) {
      throw new Error('YouTube API not initialized. Call initializeAuth() first.');
    }
    return this.youtube;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const credentials = await this.loadCredentials();
      return credentials && credentials.refresh_token ? true : false;
    } catch {
      return false;
    }
  }

  /**
   * Get current authentication status with user info
   */
  async getAuthStatus(): Promise<{ authenticated: boolean; channelName?: string; channelId?: string }> {
    try {
      const isAuth = await this.initializeAuth();
      if (!isAuth) {
        return { authenticated: false };
      }

      // Get channel info
      const response = await this.youtube.channels.list({
        part: 'snippet',
        mine: true
      });

      const channel = response.data.items?.[0];
      
      return {
        authenticated: true,
        channelName: channel?.snippet?.title,
        channelId: channel?.id
      };

    } catch (error) {
      console.error('❌ Auth status check failed:', error);
      return { authenticated: false };
    }
  }

  /**
   * Clear stored credentials (logout)
   */
  async clearCredentials(): Promise<void> {
    try {
      await fs.unlink(CREDENTIALS_PATH);
      this.oauth2Client = null;
      this.youtube = null;
      console.log('✅ Credentials cleared');
    } catch (error) {
      // File might not exist, which is fine
      console.log('⚠️ No credentials file to clear');
    }
  }

  /**
   * Save credentials to file
   */
  private async saveCredentials(credentials: YouTubeCredentials): Promise<void> {
    try {
      // Ensure config directory exists
      const configDir = join(process.cwd(), 'config');
      await fs.mkdir(configDir, { recursive: true });
      
      await fs.writeFile(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));
      console.log('💾 Credentials saved');
    } catch (error) {
      console.error('❌ Failed to save credentials:', error);
      throw error;
    }
  }

  /**
   * Load credentials from file
   */
  private async loadCredentials(): Promise<YouTubeCredentials | null> {
    try {
      const data = await fs.readFile(CREDENTIALS_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('⚠️ No credentials file found');
      return null;
    }
  }
}

// Export singleton instance
export const youtubeAuth = new YouTubeAuthenticator();