import { NextRequest, NextResponse } from 'next/server';
import { schedulePost, uploadVideoToMetricool, generatePlatformContent, shouldUseYouTubeUrl, validateContent, calculateSchedulingTimes, extractVesselName } from '@/lib/metricool/api';
import { existsSync, createReadStream, statSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const videoPath = formData.get('videoPath') as string;
    const youtubeUrl = formData.get('youtubeUrl') as string;
    const platforms = JSON.parse(formData.get('platforms') as string);
    const brandId = parseInt(formData.get('brandId') as string);
    const vesselName = formData.get('vesselName') as string;
    const youtubeMetadata = formData.get('youtubeMetadata') as string;

    console.log('🔄 API: Scheduling social media posts:', {
      platforms: Object.keys(platforms).filter(p => platforms[p]),
      brandId,
      vesselName,
      hasVideoPath: !!videoPath,
      videoPath,
      youtubeUrl,
      youtubeMetadataPreview: youtubeMetadata ? youtubeMetadata.substring(0, 100) + '...' : 'None'
    });

    if (!videoPath && !youtubeUrl) {
      return NextResponse.json(
        { success: false, error: 'Either video file path or YouTube URL is required' },
        { status: 400 }
      );
    }

    // Verify video file exists if path is provided
    if (videoPath && !existsSync(videoPath)) {
      return NextResponse.json(
        { success: false, error: 'Video file not found at specified path' },
        { status: 400 }
      );
    }

    // Calculate scheduling times
    const schedulingTimes = calculateSchedulingTimes();
    
    // Process each selected platform
    const results: Record<string, any> = {};
    const selectedPlatforms = Object.keys(platforms).filter(p => platforms[p]);

    for (const platform of selectedPlatforms) {
      try {
        console.log(`📊 Processing platform: ${platform}`);
        
        // Generate platform-specific content
        // Parse youtubeMetadata if it's a string (Phase 1 content)
        let parsedMetadata = null;
        if (youtubeMetadata) {
          try {
            // If it's already parsed JSON, use it; otherwise treat as raw content
            parsedMetadata = typeof youtubeMetadata === 'string' ? { content: youtubeMetadata } : youtubeMetadata;
          } catch (e) {
            parsedMetadata = { content: youtubeMetadata };
          }
        }
        
        const content = generatePlatformContent(vesselName, youtubeUrl, platform, parsedMetadata);
        
        // Validate content length
        const validation = validateContent(platform, content);
        if (!validation.valid) {
          results[platform] = {
            success: false,
            error: validation.error
          };
          continue;
        }

        // Determine media strategy
        const useYouTubeUrl = shouldUseYouTubeUrl(platform);
        let mediaUrl = youtubeUrl;

        // For now, always use YouTube URL since Metricool video upload isn't working properly
        // TODO: Implement proper video file upload when Metricool API is fixed
        if (!useYouTubeUrl && videoPath && false) { // Disabled for now
          try {
            // Convert file path to File object for upload
            const videoStats = statSync(videoPath);
            const videoStream = createReadStream(videoPath);
            const videoFile = new File([videoStream as any], `video-${Date.now()}.mp4`, { 
              type: 'video/mp4' 
            });
            
            mediaUrl = await uploadVideoToMetricool(videoFile);
            console.log(`✅ Video uploaded for ${platform}:`, mediaUrl);
          } catch (uploadError) {
            console.error(`❌ Video upload failed for ${platform}:`, uploadError);
            results[platform] = {
              success: false,
              error: `Video upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
            };
            continue;
          }
        }

        // Schedule the post
        const scheduledTime = schedulingTimes[platform];
        const postResult = await schedulePost(brandId, platform, content, mediaUrl, scheduledTime);
        
        results[platform] = {
          success: true,
          postId: postResult.data?.id,
          scheduledTime: scheduledTime.toISOString(),
          content: content.substring(0, 100) + '...', // Preview
          mediaUrl: useYouTubeUrl ? 'YouTube URL' : 'Uploaded Video'
        };

        console.log(`✅ Successfully scheduled ${platform} post`);

      } catch (error) {
        console.error(`❌ Error scheduling ${platform}:`, error);
        results[platform] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Count successes and failures
    const successes = Object.values(results).filter((r: any) => r.success).length;
    const failures = Object.values(results).filter((r: any) => !r.success).length;

    console.log(`📊 Scheduling complete: ${successes} successes, ${failures} failures`);

    return NextResponse.json({
      success: successes > 0,
      results,
      summary: {
        total: selectedPlatforms.length,
        successes,
        failures
      }
    });

  } catch (error) {
    console.error('❌ API: Error in schedule endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        results: {}
      },
      { status: 500 }
    );
  }
}