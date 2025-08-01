import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { youtubeUploader } from '@/lib/youtube/uploader';
import { extractMetadataFromContent, createUploadOptions, validateMetadata, formatDescriptionForYouTube } from '@/lib/youtube/metadata';
import { v4 as uuidv4 } from 'uuid';

const TEMP_DIR = join(process.cwd(), 'temp');
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024; // 2MB

// Ensure temp directory exists
async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

// Clean up temporary files
async function cleanup(files: string[]) {
  for (const file of files) {
    try {
      await unlink(file);
      console.log('🧹 Cleaned up:', file);
    } catch (error) {
      console.log('⚠️ Cleanup warning:', file, error);
    }
  }
}

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];
  
  try {
    await ensureTempDir();
    
    console.log('🎬 Processing YouTube upload request...');
    
    // Parse the multipart form data
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const metadataContent = formData.get('metadata') as string;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const privacyStatus = (formData.get('privacyStatus') as string) || 'unlisted';
    const playlistName = (formData.get('playlistName') as string) || 'YachtSpecsDirect.com';

    // Validate required fields
    if (!videoFile) {
      return NextResponse.json(
        { error: 'Video file is required' },
        { status: 400 }
      );
    }

    if (!metadataContent) {
      return NextResponse.json(
        { error: 'Metadata content is required' },
        { status: 400 }
      );
    }

    // Validate file sizes
    if (videoFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Video file too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    if (thumbnailFile && thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
      return NextResponse.json(
        { error: `Thumbnail file too large. Maximum size is ${MAX_THUMBNAIL_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    console.log('📹 Video file:', { name: videoFile.name, size: videoFile.size });
    console.log('🖼️ Thumbnail file:', thumbnailFile ? { name: thumbnailFile.name, size: thumbnailFile.size } : 'None');

    // Generate unique filenames
    const sessionId = uuidv4();
    const videoPath = join(TEMP_DIR, `upload_${sessionId}.mp4`);
    let thumbnailPath: string | undefined;
    
    tempFiles.push(videoPath);

    // Write video file to disk
    console.log('💾 Writing video file to disk...');
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    await writeFile(videoPath, videoBuffer);

    // Write thumbnail file if provided
    if (thumbnailFile) {
      thumbnailPath = join(TEMP_DIR, `thumbnail_${sessionId}.jpg`);
      tempFiles.push(thumbnailPath);
      
      console.log('💾 Writing thumbnail file to disk...');
      const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
      await writeFile(thumbnailPath, thumbnailBuffer);
    }

    // Extract and validate metadata from Phase 1 content
    console.log('📋 Extracting metadata from Phase 1 content...');
    const metadata = extractMetadataFromContent(metadataContent);
    
    // Validate metadata
    const validation = validateMetadata(metadata);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid metadata', details: validation.errors },
        { status: 400 }
      );
    }

    // Format description for YouTube
    const formattedDescription = formatDescriptionForYouTube(metadata.description);
    
    // Create upload options
    const uploadOptions = createUploadOptions(
      { ...metadata, description: formattedDescription },
      {
        privacyStatus: privacyStatus as 'private' | 'unlisted' | 'public',
        playlistName,
        thumbnailPath
      }
    );

    console.log('🚀 Starting YouTube upload with options:', {
      title: uploadOptions.title,
      tagCount: uploadOptions.tags.length,
      privacy: uploadOptions.privacyStatus,
      playlist: uploadOptions.playlistName,
      hasThumbnail: !!uploadOptions.thumbnailPath
    });

    // Upload to YouTube
    const uploadResult = await youtubeUploader.uploadVideo(
      videoPath,
      uploadOptions,
      (progress) => {
        // Note: Server-Sent Events would be better for real-time progress
        // For now, we'll rely on client-side polling or websockets
        console.log(`📊 Upload progress: ${progress.percent}% - ${progress.message}`);
      }
    );

    console.log('✅ YouTube upload completed:', uploadResult);

    // Clean up temporary files
    await cleanup(tempFiles);

    // Return success response
    return NextResponse.json({
      success: true,
      result: uploadResult,
      metadata: {
        title: metadata.title,
        tagCount: metadata.tags.length,
        privacy: uploadOptions.privacyStatus
      }
    });

  } catch (error: any) {
    console.error('❌ YouTube upload error:', error);
    
    // Clean up temp files on error
    await cleanup(tempFiles);

    // Handle specific error types
    if (error.message?.includes('Authentication')) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          details: 'Please authenticate with YouTube first',
          requiresAuth: true
        },
        { status: 401 }
      );
    }

    if (error.message?.includes('quota')) {
      return NextResponse.json(
        { 
          error: 'YouTube API quota exceeded',
          details: 'Daily upload quota has been reached. Please try again tomorrow.',
          quotaExceeded: true
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: error.message || 'Upload failed',
        details: 'YouTube video upload failed',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Get upload status or playlists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'playlists') {
      console.log('📋 Fetching user playlists...');
      const playlists = await youtubeUploader.listPlaylists();
      
      return NextResponse.json({
        success: true,
        playlists
      });
    }

    if (action === 'channel') {
      console.log('📺 Fetching channel info...');
      const channelInfo = await youtubeUploader.getChannelInfo();
      
      return NextResponse.json({
        success: true,
        channel: channelInfo
      });
    }

    if (action === 'quota') {
      console.log('📊 Fetching quota usage...');
      const quotaUsage = await youtubeUploader.getQuotaUsage();
      
      return NextResponse.json({
        success: true,
        quota: quotaUsage
      });
    }

    return NextResponse.json({
      error: 'Invalid action parameter'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ GET request failed:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout for uploads