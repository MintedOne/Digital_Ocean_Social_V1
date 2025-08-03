import { NextRequest, NextResponse } from 'next/server';
import { schedulePost, uploadVideoToMetricool, generatePlatformContent, shouldUseYouTubeUrl, validateContent, calculateSchedulingTimes, extractVesselName } from '@/lib/metricool/api';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const videoFile = formData.get('video') as File;
    const youtubeUrl = formData.get('youtubeUrl') as string;
    const platforms = JSON.parse(formData.get('platforms') as string);
    const brandId = parseInt(formData.get('brandId') as string);
    const vesselName = formData.get('vesselName') as string;
    const youtubeMetadata = formData.get('youtubeMetadata') ? JSON.parse(formData.get('youtubeMetadata') as string) : null;

    console.log('🔄 API: Scheduling social media posts:', {
      platforms: Object.keys(platforms).filter(p => platforms[p]),
      brandId,
      vesselName,
      hasVideo: !!videoFile,
      youtubeUrl
    });

    if (!videoFile && !youtubeUrl) {
      return NextResponse.json(
        { success: false, error: 'Either video file or YouTube URL is required' },
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
        const content = generatePlatformContent(vesselName, youtubeUrl, platform, youtubeMetadata);
        
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
        const useYouTubeUrl = shouldUseYouTubeUrl(platform, videoFile);
        let mediaUrl = youtubeUrl;

        // Upload video if needed
        if (!useYouTubeUrl && videoFile) {
          try {
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