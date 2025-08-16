import { NextRequest, NextResponse } from 'next/server';
import { schedulePost, generatePlatformContent, shouldUseYouTubeUrl, validateContent, calculateSchedulingTimes, extractVesselName } from '@/lib/metricool/api';
import { createDropboxIntegration } from '@/lib/dropbox/integration';
import { metricoolCalendar } from '@/lib/metricool/calendar-reader';
import { CascadingScheduler } from '@/lib/metricool/cascading-scheduler';
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
    const customDate = formData.get('customDate') as string; // Manual override date

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

    // 🌊 SMART SCHEDULING: Use custom date or cascading scheduler
    const cascadeScheduler = new CascadingScheduler(metricoolCalendar);
    let optimalBaseTime: Date;
    let cascadeDecision: any = null;
    
    if (customDate) {
      // 🎯 MANUAL OVERRIDE: Use custom date with smart time selection
      const overrideDate = new Date(customDate);
      console.log('🎯 MANUAL OVERRIDE: Using custom date:', overrideDate.toLocaleString());
      
      // Set to optimal time on the custom date (12:30 PM EDT)
      overrideDate.setHours(12, 30, 0, 0); // 12:30 PM
      optimalBaseTime = overrideDate;
      
      console.log('🎯 Override scheduling time:', optimalBaseTime.toLocaleString('en-US', { 
        timeZone: 'America/New_York',
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      }));
    } else {
      // 🌊 SMART CASCADING: Use intelligent cascade logic
      console.log('🌊 CASCADING SCHEDULER: Determining optimal posting strategy...');
      
      // Get the next action based on cascade logic
      cascadeDecision = await cascadeScheduler.getNextAction();
      console.log('🌊 Cascade Decision:', cascadeDecision);
      
      // Get optimal posting time based on cascade logic
      optimalBaseTime = cascadeScheduler.calculateOptimalPostingTime(cascadeDecision);
      
      console.log(`🌊 Cascade Analysis:`, {
        action: cascadeDecision.action,
        targetDay: cascadeDecision.day,
        targetDate: cascadeDecision.date,
        currentTopics: cascadeDecision.currentTopics,
        level: cascadeDecision.newLevel,
        isLevelIncrease: cascadeDecision.isLevelIncrease
      });
    }
    
    console.log(`⏰ Final optimal time: ${optimalBaseTime.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })}`);
    
    // Get staggered times for all platforms
    const selectedPlatforms = Object.keys(platforms).filter(p => platforms[p]);
    const staggeredTimes = cascadeScheduler.getStaggeredPlatformTimes(optimalBaseTime, selectedPlatforms);
    
    // Map to expected format
    const schedulingTimes: Record<string, Date> = {
      twitter: staggeredTimes.twitter || optimalBaseTime,
      instagram: staggeredTimes.instagram || optimalBaseTime,
      linkedin: staggeredTimes.linkedin || optimalBaseTime,
      facebook: staggeredTimes.facebook || optimalBaseTime,
      tiktok: staggeredTimes.tiktok || optimalBaseTime,
      gmb: staggeredTimes.gmb || optimalBaseTime
    };
    
    console.log('🌊 Cascading scheduling times calculated:', {
      twitter: schedulingTimes.twitter.toLocaleString('en-US', { timeZone: 'America/New_York' }),
      instagram: schedulingTimes.instagram.toLocaleString('en-US', { timeZone: 'America/New_York' }),
      facebook: schedulingTimes.facebook.toLocaleString('en-US', { timeZone: 'America/New_York' }),
      linkedin: schedulingTimes.linkedin.toLocaleString('en-US', { timeZone: 'America/New_York' }),
      tiktok: schedulingTimes.tiktok.toLocaleString('en-US', { timeZone: 'America/New_York' }),
      gmb: schedulingTimes.gmb.toLocaleString('en-US', { timeZone: 'America/New_York' })
    });
    
    // Process each selected platform
    const results: Record<string, any> = {};

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
        
        // Determine media strategy - check video file size first
        let videoSize = 0;
        if (videoPath && existsSync(videoPath)) {
          const fs = await import('fs');
          const stats = fs.statSync(videoPath);
          videoSize = stats.size;
        }
        
        const useYouTubeUrl = shouldUseYouTubeUrl(platform, videoPath, videoSize);
        
        // Generate content with knowledge of whether we're using Dropbox
        const content = generatePlatformContent(vesselName, youtubeUrl, platform, parsedMetadata, !useYouTubeUrl);
        
        // Validate content length
        const validation = validateContent(platform, content);
        if (!validation.valid) {
          results[platform] = {
            success: false,
            error: validation.error
          };
          continue;
        }
        let mediaUrl = youtubeUrl;

        // NEW: Use Dropbox share links for platforms that need video files
        if (!useYouTubeUrl && videoPath) {
          try {
            console.log(`🔗 Generating Dropbox share link for ${platform}...`);
            
            // Initialize Dropbox integration
            const dropbox = createDropboxIntegration();
            
            // Generate Dropbox share link with dl=1 parameter
            const dropboxResult = await dropbox.processVideoForMetricool(videoPath);
            
            if (dropboxResult.success) {
              mediaUrl = dropboxResult.url!;
              console.log(`✅ Dropbox share link ready for ${platform}: ${mediaUrl}`);
            } else {
              throw new Error(dropboxResult.error || 'Failed to generate Dropbox share link');
            }
            
          } catch (dropboxError) {
            console.error(`❌ Dropbox share link failed for ${platform}:`, dropboxError);
            // Fallback to YouTube URL if Dropbox fails
            console.log(`🔄 Falling back to YouTube URL for ${platform}`);
            mediaUrl = youtubeUrl;
            
            if (!mediaUrl) {
              results[platform] = {
                success: false,
                error: `Dropbox share link failed and no YouTube URL available: ${dropboxError instanceof Error ? dropboxError.message : 'Unknown error'}`
              };
              continue;
            }
          }
        }

        // Schedule the post
        const scheduledTime = schedulingTimes[platform];
        const postResult = await schedulePost(brandId, platform, content, mediaUrl, scheduledTime);
        
        // Determine media type for reporting
        let mediaType = 'YouTube URL';
        if (!useYouTubeUrl && mediaUrl && mediaUrl.includes('dropbox.com')) {
          mediaType = 'Dropbox Share Link';
        } else if (!useYouTubeUrl) {
          mediaType = 'Direct Upload';
        }

        results[platform] = {
          success: true,
          postId: postResult.data?.id,
          scheduledTime: scheduledTime.toISOString(),
          content: content.substring(0, 100) + '...', // Preview
          mediaUrl: mediaType
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