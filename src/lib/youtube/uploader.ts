import { youtubeAuth } from './auth';
import { YouTubeUploadOptions } from './metadata';
import { createReadStream, statSync } from 'fs';

export interface YouTubeUploadResult {
  videoId: string;
  url: string;
  status: 'uploaded' | 'processing' | 'failed';
  title: string;
  playlistAdded?: boolean;
  thumbnailUploaded?: boolean;
}

export interface UploadProgress {
  stage: 'uploading' | 'playlist' | 'thumbnail' | 'complete';
  percent: number;
  message: string;
  uploadedBytes?: number;
  totalBytes?: number;
  uploadedFormatted?: string;
  totalFormatted?: string;
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export class YouTubeUploader {
  private youtube: any;

  constructor() {
    // YouTube API will be initialized when needed
  }

  /**
   * Initialize uploader with authentication
   */
  private async initialize(): Promise<void> {
    const isAuthenticated = await youtubeAuth.initializeAuth();
    if (!isAuthenticated) {
      throw new Error('YouTube authentication required. Please authenticate first.');
    }
    
    this.youtube = youtubeAuth.getYouTubeAPI();
  }

  /**
   * Upload video to YouTube with metadata
   */
  async uploadVideo(
    videoPath: string,
    options: YouTubeUploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<YouTubeUploadResult> {
    await this.initialize();

    console.log('🎬 Starting YouTube upload...');
    console.log('📹 Video:', videoPath);
    console.log('📝 Upload Options:', {
      title: options.title,
      titleLength: options.title.length,
      privacy: options.privacyStatus,
      tagCount: options.tags.length,
      tags: options.tags.slice(0, 8), // Show first 8 tags
      allTags: options.tags.join(', '),
      tagStringLength: options.tags.join(', ').length,
      playlist: options.playlistName
    });

    try {
      // Get file size for progress tracking
      const fileStats = statSync(videoPath);
      const totalBytes = fileStats.size;
      
      // Stage 1: Upload video
      onProgress?.({ 
        stage: 'uploading', 
        percent: 10, 
        message: 'Uploading video to YouTube...',
        uploadedBytes: 0,
        totalBytes,
        uploadedFormatted: formatFileSize(0),
        totalFormatted: formatFileSize(totalBytes)
      });

      const uploadParams = {
        part: 'snippet,status',
        requestBody: {
          snippet: {
            title: options.title,
            description: options.description,
            tags: options.tags,
            categoryId: options.categoryId, // Autos & Vehicles
            defaultLanguage: 'en',
            defaultAudioLanguage: 'en'
          },
          status: {
            privacyStatus: options.privacyStatus, // 'unlisted' by default
            embeddable: true,
            license: 'youtube',
            publicStatsViewable: true
          }
        },
        media: {
          body: createReadStream(videoPath)
        }
      };

      // Simulate progressive upload tracking
      const progressInterval = setInterval(() => {
        // Since we can't get real-time upload progress from googleapis,
        // we'll simulate progress based on time elapsed
        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - uploadStartTime) / 1000;
        
        // Estimate progress based on file size and elapsed time
        // Assume upload speed of ~5MB/s average
        const estimatedBytesPerSecond = 5 * 1024 * 1024; // 5MB/s
        const estimatedUploaded = Math.min(totalBytes * 0.9, elapsedSeconds * estimatedBytesPerSecond);
        const progressPercent = Math.min(90, (estimatedUploaded / totalBytes) * 100);
        
        onProgress?.({ 
          stage: 'uploading', 
          percent: Math.round(progressPercent), 
          message: 'Processing video upload...',
          uploadedBytes: Math.round(estimatedUploaded),
          totalBytes,
          uploadedFormatted: formatFileSize(estimatedUploaded),
          totalFormatted: formatFileSize(totalBytes)
        });
      }, 2000); // Update every 2 seconds

      const uploadStartTime = Date.now();

      const response = await this.youtube.videos.insert(uploadParams);
      clearInterval(progressInterval); // Stop progress simulation
      
      const videoId = response.data.id;
      
      if (!videoId) {
        throw new Error('Upload failed: No video ID returned');
      }

      console.log('✅ Video uploaded successfully:', videoId);
      onProgress?.({ 
        stage: 'uploading', 
        percent: 70, 
        message: 'Video uploaded successfully!',
        uploadedBytes: totalBytes,
        totalBytes,
        uploadedFormatted: formatFileSize(totalBytes),
        totalFormatted: formatFileSize(totalBytes)
      });

      const result: YouTubeUploadResult = {
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        status: 'uploaded',
        title: options.title
      };

      // Stage 2: Add to playlist (if specified)
      if (options.playlistName) {
        try {
          onProgress?.({ 
            stage: 'playlist', 
            percent: 80, 
            message: `Adding to ${options.playlistName} playlist...`,
            uploadedBytes: totalBytes,
            totalBytes,
            uploadedFormatted: formatFileSize(totalBytes),
            totalFormatted: formatFileSize(totalBytes)
          });
          await this.addToPlaylist(videoId, options.playlistName);
          result.playlistAdded = true;
          console.log('✅ Added to playlist:', options.playlistName);
        } catch (error) {
          console.warn('⚠️ Playlist addition failed:', error);
          result.playlistAdded = false;
        }
      }

      // Stage 3: Upload thumbnail (if provided)
      if (options.thumbnailPath) {
        try {
          onProgress?.({ 
            stage: 'thumbnail', 
            percent: 90, 
            message: 'Uploading custom thumbnail...',
            uploadedBytes: totalBytes,
            totalBytes,
            uploadedFormatted: formatFileSize(totalBytes),
            totalFormatted: formatFileSize(totalBytes)
          });
          await this.uploadThumbnail(videoId, options.thumbnailPath);
          result.thumbnailUploaded = true;
          console.log('✅ Thumbnail uploaded');
        } catch (error) {
          console.warn('⚠️ Thumbnail upload failed:', error);
          result.thumbnailUploaded = false;
        }
      }

      // Complete
      onProgress?.({ 
        stage: 'complete', 
        percent: 100, 
        message: 'Upload complete!',
        uploadedBytes: totalBytes,
        totalBytes,
        uploadedFormatted: formatFileSize(totalBytes),
        totalFormatted: formatFileSize(totalBytes)
      });

      console.log('🎉 YouTube upload completed successfully');
      return result;

    } catch (error: any) {
      console.error('❌ YouTube upload failed:', error);
      
      // Handle specific YouTube API errors
      if (error.code === 401) {
        throw new Error('Authentication expired. Please re-authenticate with YouTube.');
      } else if (error.code === 403) {
        throw new Error('Insufficient permissions. Check YouTube API quotas and permissions.');
      } else if (error.code === 400) {
        throw new Error(`Invalid request: ${error.message || 'Bad request parameters'}`);
      }
      
      throw new Error(`Upload failed: ${error.message || 'Unknown error occurred'}`);
    }
  }

  /**
   * Add video to a specific playlist
   */
  private async addToPlaylist(videoId: string, playlistName: string): Promise<void> {
    console.log('📋 Adding video to playlist:', playlistName);

    // Find playlist by name
    const playlistsResponse = await this.youtube.playlists.list({
      part: 'snippet',
      mine: true,
      maxResults: 50
    });

    const playlist = playlistsResponse.data.items?.find(
      (p: any) => p.snippet.title === playlistName
    );

    if (!playlist) {
      console.warn('⚠️ Playlist not found, attempting to create:', playlistName);
      
      // Create playlist if it doesn't exist
      const createResponse = await this.youtube.playlists.insert({
        part: 'snippet,status',
        requestBody: {
          snippet: {
            title: playlistName,
            description: 'Yacht reviews and specifications from YachtSpecsDirect.com'
          },
          status: {
            privacyStatus: 'unlisted' // Match video privacy
          }
        }
      });

      const newPlaylistId = createResponse.data.id;
      console.log('✅ Created new playlist:', newPlaylistId);

      // Add video to new playlist
      await this.youtube.playlistItems.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            playlistId: newPlaylistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId
            }
          }
        }
      });

    } else {
      // Add video to existing playlist
      await this.youtube.playlistItems.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            playlistId: playlist.id,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId
            }
          }
        }
      });
    }

    console.log('✅ Video added to playlist successfully');
  }

  /**
   * Upload custom thumbnail for video
   */
  private async uploadThumbnail(videoId: string, thumbnailPath: string): Promise<void> {
    console.log('🖼️ Uploading thumbnail:', thumbnailPath);

    // Check if file exists and get stats
    try {
      const stats = statSync(thumbnailPath);
      if (stats.size > 2 * 1024 * 1024) { // 2MB limit
        throw new Error('Thumbnail file too large (max 2MB)');
      }
    } catch (error) {
      throw new Error(`Thumbnail file error: ${error}`);
    }

    await this.youtube.thumbnails.set({
      videoId: videoId,
      media: {
        body: createReadStream(thumbnailPath)
      }
    });

    console.log('✅ Thumbnail uploaded successfully');
  }

  /**
   * Get upload quota usage (useful for monitoring)
   */
  async getQuotaUsage(): Promise<{ used: number; limit: number }> {
    try {
      // This would require YouTube Analytics API or manual tracking
      // For now, return estimated values
      return {
        used: 0,
        limit: 10000 // Default daily quota
      };
    } catch (error) {
      console.warn('⚠️ Could not retrieve quota usage:', error);
      return { used: 0, limit: 10000 };
    }
  }

  /**
   * List user's playlists
   */
  async listPlaylists(): Promise<Array<{ id: string; title: string; itemCount: number }>> {
    await this.initialize();

    try {
      const response = await this.youtube.playlists.list({
        part: 'snippet,contentDetails',
        mine: true,
        maxResults: 50
      });

      return response.data.items?.map((playlist: any) => ({
        id: playlist.id,
        title: playlist.snippet.title,
        itemCount: playlist.contentDetails.itemCount
      })) || [];

    } catch (error) {
      console.error('❌ Failed to list playlists:', error);
      return [];
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(): Promise<{ id: string; title: string; description: string } | null> {
    await this.initialize();

    try {
      const response = await this.youtube.channels.list({
        part: 'snippet',
        mine: true
      });

      const channel = response.data.items?.[0];
      if (!channel) return null;

      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description
      };

    } catch (error) {
      console.error('❌ Failed to get channel info:', error);
      return null;
    }
  }

  /**
   * Update video metadata after upload
   */
  async updateVideoMetadata(
    videoId: string, 
    updates: Partial<YouTubeUploadOptions>
  ): Promise<boolean> {
    await this.initialize();

    try {
      const updateData: any = {
        id: videoId,
        snippet: {}
      };

      if (updates.title) updateData.snippet.title = updates.title;
      if (updates.description) updateData.snippet.description = updates.description;
      if (updates.tags) updateData.snippet.tags = updates.tags;

      await this.youtube.videos.update({
        part: 'snippet',
        requestBody: updateData
      });

      console.log('✅ Video metadata updated:', videoId);
      return true;

    } catch (error) {
      console.error('❌ Failed to update video metadata:', error);
      return false;
    }
  }
}

// Export singleton instance
export const youtubeUploader = new YouTubeUploader();