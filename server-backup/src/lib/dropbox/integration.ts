/**
 * Dropbox Integration for Metricool Video Sharing
 * Generates shareable links with auto-download (dl=1) for video files
 */

import { Dropbox } from 'dropbox';
import path from 'path';

export interface DropboxConfig {
  app_key: string;
  app_secret: string;
  refresh_token: string;
}

export interface ShareLinkResult {
  success: boolean;
  shareUrl?: string;
  directUrl?: string;
  dropboxPath?: string;
  method?: 'existing_link' | 'new_link' | 'retrieved_existing';
  error?: string;
}

export interface MetricoolVideoResult {
  success: boolean;
  url?: string;
  dropboxPath?: string;
  method?: string;
  error?: string;
}

export class DropboxIntegration {
  private dbx: Dropbox;
  private config: DropboxConfig;

  constructor(config: DropboxConfig) {
    // Initialize with refresh token for auto-refresh capability
    // Provide fetch for Node.js environment compatibility
    this.dbx = new Dropbox({
      clientId: config.app_key,
      clientSecret: config.app_secret,
      refreshToken: config.refresh_token,
      fetch: globalThis.fetch || fetch
    });
    
    this.config = config;
  }

  /**
   * Generate a share link for a video file
   * @param localFilePath - Full path to video file on local system
   * @returns Share link details including direct download URL
   */
  async generateShareLink(localFilePath: string): Promise<ShareLinkResult> {
    try {
      // Convert local path to Dropbox path
      const dropboxPath = this.convertToDropboxPath(localFilePath);
      
      console.log(`🔗 Generating share link for: ${dropboxPath}`);
      
      // First, check if a share link already exists
      try {
        const existingLinks = await this.dbx.sharingListSharedLinks({
          path: dropboxPath,
          direct_only: true
        });
        
        if (existingLinks.result.links && existingLinks.result.links.length > 0) {
          const existingUrl = existingLinks.result.links[0].url;
          console.log(`✅ Found existing share link`);
          
          return {
            success: true,
            shareUrl: existingUrl,
            directUrl: this.convertToDirectDownload(existingUrl),
            dropboxPath: dropboxPath,
            method: 'existing_link'
          };
        }
      } catch (listError) {
        // No existing links, proceed to create new one
        console.log(`📝 No existing link found, creating new one...`);
      }
      
      // Create new share link
      try {
        const response = await this.dbx.sharingCreateSharedLinkWithSettings({
          path: dropboxPath,
          settings: {
            requested_visibility: { '.tag': 'public' },
            allow_download: true
          }
        });
        
        const shareUrl = response.result.url;
        console.log(`✅ New share link created`);
        
        return {
          success: true,
          shareUrl: shareUrl,
          directUrl: this.convertToDirectDownload(shareUrl),
          dropboxPath: dropboxPath,
          method: 'new_link'
        };
        
      } catch (createError: any) {
        // Handle "shared_link_already_exists" error
        if (createError.error && createError.error.error && 
            createError.error.error['.tag'] === 'shared_link_already_exists') {
          
          console.log(`🔄 Link already exists, retrieving...`);
          
          const existingLinks = await this.dbx.sharingListSharedLinks({
            path: dropboxPath,
            direct_only: true
          });
          
          if (existingLinks.result.links && existingLinks.result.links.length > 0) {
            const existingUrl = existingLinks.result.links[0].url;
            
            return {
              success: true,
              shareUrl: existingUrl,
              directUrl: this.convertToDirectDownload(existingUrl),
              dropboxPath: dropboxPath,
              method: 'retrieved_existing'
            };
          }
        }
        
        throw createError;
      }
      
    } catch (error: any) {
      console.error(`❌ Error generating share link:`, error);
      
      return {
        success: false,
        error: error.message || 'Unknown error',
        dropboxPath: this.convertToDropboxPath(localFilePath)
      };
    }
  }

  /**
   * Convert local file path to Dropbox path format
   */
  convertToDropboxPath(localPath: string): string {
    // Remove local Dropbox folder prefix
    const dropboxPrefix = '/Users/mintedone/Library/CloudStorage/Dropbox';
    
    if (localPath.startsWith(dropboxPrefix)) {
      return localPath.replace(dropboxPrefix, '');
    }
    
    // If path doesn't start with Dropbox prefix, assume it's already relative
    if (!localPath.startsWith('/')) {
      return '/' + localPath;
    }
    
    return localPath;
  }

  /**
   * Convert share URL to direct download URL
   * CRITICAL: The dl=1 parameter is ESSENTIAL for Metricool
   */
  convertToDirectDownload(shareUrl: string): string {
    // Replace dl=0 with dl=1 for auto-download
    if (shareUrl.includes('?dl=0')) {
      return shareUrl.replace('?dl=0', '?dl=1');
    } else if (shareUrl.includes('&dl=0')) {
      return shareUrl.replace('&dl=0', '&dl=1');
    } else if (!shareUrl.includes('dl=1')) {
      // Add dl=1 if not present
      const separator = shareUrl.includes('?') ? '&' : '?';
      return shareUrl + separator + 'dl=1';
    }
    
    return shareUrl;
  }

  /**
   * Process video for Metricool - main entry point
   * This is what the Metricool integration should call
   */
  async processVideoForMetricool(videoFilePath: string): Promise<MetricoolVideoResult> {
    console.log(`\n🎬 Processing video for Metricool upload`);
    console.log(`📁 Video: ${path.basename(videoFilePath)}`);
    
    // Generate share link
    const result = await this.generateShareLink(videoFilePath);
    
    if (result.success) {
      console.log(`✅ Dropbox URL ready for Metricool:`);
      console.log(`   📎 Direct URL: ${result.directUrl}`);
      
      // Validate URL format for Metricool
      if (!result.directUrl?.includes('dl=1')) {
        console.warn(`⚠️ WARNING: URL missing dl=1 parameter!`);
      }
      
      return {
        success: true,
        url: result.directUrl!,  // This is what goes to Metricool
        dropboxPath: result.dropboxPath,
        method: result.method
      };
    } else {
      console.error(`❌ Failed to generate Dropbox link: ${result.error}`);
      return {
        success: false,
        error: result.error
      };
    }
  }

  /**
   * Test the Dropbox connection and authentication
   */
  async testConnection(): Promise<{ success: boolean; error?: string; accountInfo?: any }> {
    try {
      console.log('🧪 Testing Dropbox connection...');
      
      const response = await this.dbx.usersGetCurrentAccount();
      const accountInfo = response.result;
      
      console.log('✅ Dropbox connection successful');
      console.log(`   Account: ${accountInfo.name.display_name}`);
      console.log(`   Email: ${accountInfo.email}`);
      
      return {
        success: true,
        accountInfo
      };
    } catch (error: any) {
      console.error('❌ Dropbox connection failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown connection error'
      };
    }
  }
}

/**
 * Create Dropbox integration instance from environment variables
 */
export function createDropboxIntegration(): DropboxIntegration {
  const config: DropboxConfig = {
    app_key: process.env.DROPBOX_APP_KEY!,
    app_secret: process.env.DROPBOX_APP_SECRET!,
    refresh_token: process.env.DROPBOX_REFRESH_TOKEN!
  };

  // Validate required environment variables
  const missing = [];
  if (!config.app_key) missing.push('DROPBOX_APP_KEY');
  if (!config.app_secret) missing.push('DROPBOX_APP_SECRET');
  if (!config.refresh_token) missing.push('DROPBOX_REFRESH_TOKEN');

  if (missing.length > 0) {
    throw new Error(`Missing required Dropbox environment variables: ${missing.join(', ')}`);
  }

  return new DropboxIntegration(config);
}