/**
 * Google Email Sender
 * Uses existing Google OAuth to send emails via Gmail API
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import { join } from 'path';

// Use same scopes as YouTube auth (includes Gmail)
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/gmail.send'
];

const CREDENTIALS_PATH = join(process.cwd(), 'config', 'youtube-credentials.json');

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class GoogleEmailSender {
  private oauth2Client: OAuth2Client | null = null;
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private adminEmail: string;

  constructor() {
    this.fromEmail = process.env.GOOGLE_EMAIL || 'mintedyachts@gmail.com';
    this.adminEmail = process.env.ADMIN_EMAIL || 'info@mintedyachts.com';
  }

  /**
   * Initialize OAuth2 client
   */
  private async initializeOAuth2Client() {
    if (this.oauth2Client) {
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

    // Try to load existing credentials
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
      }
    } catch (error) {
      console.log('No existing Google credentials found, will need to authenticate');
    }
  }

  /**
   * Initialize nodemailer transporter with OAuth2
   */
  private async initializeTransporter() {
    if (this.transporter) {
      return;
    }

    await this.initializeOAuth2Client();

    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    // Get access token
    const { credentials } = await this.oauth2Client.getAccessToken();
    
    if (!credentials || !credentials.access_token) {
      throw new Error('Unable to get access token. Please authenticate with Google first.');
    }

    // Create transporter with OAuth2
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.fromEmail,
        clientId: process.env.YOUTUBE_CLIENT_ID!,
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
        refreshToken: credentials.refresh_token || '',
        accessToken: credentials.access_token
      }
    });

    // Verify transporter
    await this.transporter.verify();
    console.log('✅ Email transporter initialized successfully');
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.initializeTransporter();

      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: `Minted Yachts <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${options.to}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
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
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
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
      console.log(`⚠️ Google Email Service Not Configured`);
      console.log(`ℹ️ Missing environment variables: YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET`);
      console.log(`ℹ️ Email notifications will not be sent until OAuth is configured.`);
    }
    return isConfigured;
  }
}