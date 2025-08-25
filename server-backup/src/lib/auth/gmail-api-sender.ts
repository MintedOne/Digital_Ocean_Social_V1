/**
 * Gmail API Email Sender
 * Uses Gmail API directly instead of SMTP with OAuth2
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { promises as fs } from 'fs';
import { join } from 'path';

const CREDENTIALS_PATH = join(process.cwd(), 'config', 'youtube-credentials.json');

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class GmailAPISender {
  private oauth2Client: OAuth2Client | null = null;
  private gmail: any = null;
  private fromEmail: string;
  private adminEmail: string;

  constructor() {
    this.fromEmail = process.env.GOOGLE_EMAIL || 'mintedyachts@gmail.com';
    this.adminEmail = process.env.ADMIN_EMAIL || 'info@mintedyachts.com';
  }

  /**
   * Initialize OAuth2 client using existing YouTube credentials
   */
  private async initializeOAuth2Client() {
    if (this.oauth2Client && this.gmail) {
      return;
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/auth/callback';

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth2 credentials not found in environment variables');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Load existing YouTube credentials
    try {
      const credentialsData = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
      const credentials = JSON.parse(credentialsData);
      
      if (credentials.refresh_token) {
        this.oauth2Client.setCredentials({
          refresh_token: credentials.refresh_token,
          access_token: credentials.access_token,
          token_type: credentials.token_type,
          expiry_date: credentials.expiry_date
        });
        
        // Initialize Gmail API
        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        
        console.log('✅ Gmail API initialized with OAuth credentials');
      } else {
        throw new Error('No refresh token found in credentials');
      }
    } catch (error) {
      console.error('❌ Failed to load YouTube credentials for Gmail API:', error);
      throw new Error('No valid Google credentials found. Please authenticate with YouTube first.');
    }
  }

  /**
   * Create email message in base64 format for Gmail API
   */
  private createMessage(options: EmailOptions): string {
    const messageParts = [
      `From: Minted Yachts <${this.fromEmail}>`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      options.html
    ];
    
    const message = messageParts.join('\r\n');
    
    // Convert to base64url format required by Gmail API
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return encodedMessage;
  }

  /**
   * Send an email using Gmail API
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      console.log(`📧 Starting Gmail API email send to ${options.to}`);
      console.log(`📧 Subject: ${options.subject}`);
      
      await this.initializeOAuth2Client();

      if (!this.gmail) {
        console.error('❌ Gmail API not initialized');
        throw new Error('Gmail API not initialized');
      }

      console.log('✅ Gmail API ready, creating message...');

      const raw = this.createMessage(options);

      console.log(`📧 Sending email via Gmail API from ${this.fromEmail} to ${options.to}...`);
      
      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: raw
        }
      });
      
      console.log(`✅ Email sent successfully via Gmail API to ${options.to}: ${result.data.id}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending email via Gmail API:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      return false;
    }
  }

  /**
   * Send admin notification for new user registration
   */
  async sendAdminNotification(userEmail: string, userName: string): Promise<boolean> {
    const template = await this.loadEmailTemplate('admin-notification');
    const html = template
      .replace(/\{\{userEmail\}\}/g, userEmail)
      .replace(/\{\{userName\}\}/g, userName)
      .replace(/\{\{date\}\}/g, new Date().toLocaleString())
      .replace(/\{\{adminUrl\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin`);

    return await this.sendEmail({
      to: this.adminEmail,
      subject: `New User Registration: ${userEmail}`,
      html
    });
  }

  /**
   * Send user approval notification with password setup link
   */
  async sendUserApprovalEmail(userEmail: string, userName: string, setupToken: string): Promise<boolean> {
    const template = await this.loadEmailTemplate('user-approved');
    const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup-password?token=${setupToken}`;
    
    const html = template
      .replace(/\{\{userName\}\}/g, userName)
      .replace(/\{\{setupUrl\}\}/g, setupUrl)
      .replace(/\{\{expiryTime\}\}/g, '24 hours');

    return await this.sendEmail({
      to: userEmail,
      subject: 'Your Minted Yachts Account Has Been Approved',
      html
    });
  }

  /**
   * Send admin password recovery email
   */
  async sendAdminPasswordRecovery(adminEmail: string, adminName: string): Promise<boolean> {
    const template = await this.loadEmailTemplate('password-recovery');
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const adminPassword = `SocialPosts${currentYear}`;
    
    const html = template
      .replace(/\{\{adminName\}\}/g, adminName)
      .replace(/\{\{adminPassword\}\}/g, adminPassword)
      .replace(/\{\{currentYear\}\}/g, currentYear.toString())
      .replace(/\{\{nextYear\}\}/g, nextYear.toString())
      .replace(/\{\{loginUrl\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`);

    return await this.sendEmail({
      to: adminEmail,
      subject: 'Admin Password Recovery - Minted Yachts',
      html
    });
  }

  /**
   * Load email template
   */
  private async loadEmailTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = join(process.cwd(), 'src', 'templates', 'email', `${templateName}.html`);
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      // Return a basic template as fallback
      return this.getBasicTemplate();
    }
  }

  /**
   * Get basic email template
   */
  private getBasicTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Minted Yachts</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Minted Yachts Notification</h2>
            <p>This is an automated message from the Minted Yachts system.</p>
            <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              This email was sent from an automated system. Please do not reply directly to this email.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    const isConfigured = !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET);
    if (!isConfigured) {
      console.log(`⚠️ Gmail API Service Not Configured`);
      console.log(`ℹ️ Missing environment variables: YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET`);
      console.log(`ℹ️ Email notifications will not be sent until OAuth is configured.`);
    }
    return isConfigured;
  }
}