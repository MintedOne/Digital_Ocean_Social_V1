/**
 * Metricool API Integration
 * Phase 3: Social Media Distribution
 */

import { METRICOOL_CONFIG, METRICOOL_BRAND, PLATFORM_LIMITS } from './config';

export interface MetricoolBrand {
  label: string;
  id: number;
  userId: number;
  networks: Record<string, string>;
  timezone: string;
}

export interface ScheduledPost {
  platform: string;
  content: string;
  scheduledTime: string;
  mediaUrl?: string;
  useYouTubeUrl?: boolean;
}

export interface PostProgress {
  platform: string;
  percent: number;
  status: string;
}

/**
 * Calculate scheduling times for staggered posting
 * Based on current system logic - minimum 30 minutes from now
 */
export function calculateSchedulingTimes(): Record<string, Date> {
  const now = new Date();
  const baseTime = new Date(now);
  
  // At least 30 minutes from now
  baseTime.setMinutes(baseTime.getMinutes() + 30);
  
  // If after 11 PM, schedule for tomorrow at 2 PM
  if (now.getHours() >= 23) {
    baseTime.setDate(baseTime.getDate() + 1);
    baseTime.setHours(14, 0, 0, 0);
  } else if (now.getHours() < 14) {
    // If before 2 PM, schedule for 2 PM today
    baseTime.setHours(14, 0, 0, 0);
  }
  
  // Create staggered times for each platform (5-minute intervals)
  return {
    twitter: new Date(baseTime),
    instagram: new Date(baseTime.getTime() + 5 * 60000),
    linkedin: new Date(baseTime.getTime() + 10 * 60000),
    facebook: new Date(baseTime.getTime() + 15 * 60000),
    tiktok: new Date(baseTime.getTime() + 20 * 60000),
    gmb: new Date(baseTime.getTime() + 30 * 60000) // Google Business 30 min later
  };
}

/**
 * Extract vessel name from video filename
 * Based on current system pattern - gets everything before first hyphen
 */
export function extractVesselName(videoPath: string): { vesselName: string; manufacturer: string } {
  const filename = videoPath.split('/').pop() || videoPath;
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Extract vessel name using pattern from current system
  const vesselMatch = nameWithoutExt.match(/^([^-]+)/);
  const vesselName = vesselMatch ? vesselMatch[1] : nameWithoutExt.split('-')[0];
  
  // Also try to get manufacturer for metadata matching
  const manufacturer = vesselName.split('-')[0];
  
  return { vesselName, manufacturer };
}

/**
 * Generate platform-specific content with character limits
 */
export function generatePlatformContent(
  vesselName: string, 
  youtubeUrl: string, 
  platform: string, 
  youtubeMetadata?: any
): string {
  // Base content from YouTube metadata if available
  const baseContent = {
    title: `${vesselName} - Luxury Yacht Tour`,
    description: youtubeMetadata?.description?.split('\n')[0] || `🛥️ Experience the luxury of ${vesselName}`,
    hashtags: '#yacht #luxury #florida #yachtlife #marine #boat #vessel',
    contact: `💼 Contact: YachtSpecsDirect.com\n📱 Tony Smith: +1 (404) 805-9819`
  };
  
  // Platform-specific formatting with character limits
  switch(platform) {
    case 'twitter':
      // 280 char limit - use YouTube URL for long videos
      const twitterText = `${baseContent.title}\n\n${youtubeUrl}\n\n${baseContent.hashtags}`;
      if (twitterText.length > 280) {
        // Truncate to fit
        return twitterText.substring(0, 277) + '...';
      }
      return twitterText;
      
    case 'instagram':
      // 2,200 chars - no clickable links in posts
      return `${baseContent.description}\n\n${baseContent.contact}\n\n${baseContent.hashtags}`;
      
    case 'linkedin':
      // 3,000 chars
      return `${baseContent.title}\n\n${baseContent.description}\n\n${baseContent.contact}\n\nWatch the full tour: ${youtubeUrl}\n\n${baseContent.hashtags}`;
      
    case 'facebook':
      // 1,500 char limit
      return `${baseContent.title}\n\n${baseContent.description}\n\n${baseContent.contact}\n\n${youtubeUrl}\n\n${baseContent.hashtags}`;
      
    case 'gmb':
      // Google Business - 1,500 chars, URL first
      return `${youtubeUrl}\n\n🛥️ ${baseContent.title}\n\n${baseContent.description}\n\n${baseContent.contact}`;
      
    case 'tiktok':
      // 2,200 chars
      return `${baseContent.description}\n\n${baseContent.contact}\n\n${baseContent.hashtags}`;
      
    default:
      return baseContent.description;
  }
}

/**
 * Validate content against platform character limits
 */
export function validateContent(platform: string, content: string): { valid: boolean; error?: string } {
  const limit = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];
  if (!limit) {
    return { valid: false, error: `Unknown platform: ${platform}` };
  }
  
  if (content.length > limit) {
    return { 
      valid: false, 
      error: `Content exceeds ${limit} character limit for ${platform}. Current: ${content.length} characters.` 
    };
  }
  
  return { valid: true };
}

/**
 * Determine if should use YouTube URL vs video file for platform
 */
export function shouldUseYouTubeUrl(platform: string, videoFile?: File): boolean {
  // For Twitter/X and Google Business, use YouTube URL for videos > 2 minutes
  if (platform === 'twitter' || platform === 'gmb') {
    return true; // For now, always use YouTube URL for these platforms
  }
  
  // Instagram, TikTok require actual video files
  if (platform === 'instagram' || platform === 'tiktok') {
    return false;
  }
  
  // Facebook, LinkedIn can use either - prefer video files for better engagement
  return false;
}

/**
 * Get available brands from Metricool API (Direct API, no MCP)
 * Fixed: Using correct endpoint with proper URL parameters
 */
export async function fetchMetricoolBrands(): Promise<MetricoolBrand[]> {
  try {
    console.log('📊 Fetching brands from Metricool API...');
    
    // Fixed: Using correct Metricool API endpoint from your account
    const url = `${METRICOOL_CONFIG.baseURL}/v2/settings/brands?userToken=${METRICOOL_CONFIG.userToken}&userId=${METRICOOL_CONFIG.userId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Mc-Auth': METRICOOL_CONFIG.userToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('⚠️ Failed to fetch brands from API, using default:', response.status);
      // Try fallback endpoint
      const fallbackUrl = `${METRICOOL_CONFIG.baseURL}/v1/brands?userToken=${METRICOOL_CONFIG.userToken}&userId=${METRICOOL_CONFIG.userId}`;
      const fallbackResponse = await fetch(fallbackUrl, {
        method: 'GET',
        headers: {
          'X-Mc-Auth': METRICOOL_CONFIG.userToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        console.log('✅ Fetched brands from fallback endpoint:', fallbackData);
        
        if (fallbackData.data && Array.isArray(fallbackData.data)) {
          return fallbackData.data.map((brand: any) => ({
            label: brand.name || brand.label,
            id: brand.id,
            userId: brand.user_id || METRICOOL_CONFIG.userId,
            networks: brand.networks || {},
            timezone: brand.timezone || METRICOOL_CONFIG.timezone
          }));
        }
      }
      
      // Fallback to configured brand
      return [METRICOOL_BRAND];
    }

    const data = await response.json();
    console.log('✅ Fetched brands:', data);
    
    // Transform API response to our brand format
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((brand: any) => ({
        label: brand.name || brand.label,
        id: brand.id,
        userId: brand.user_id || METRICOOL_CONFIG.userId,
        networks: brand.networks || {},
        timezone: brand.timezone || METRICOOL_CONFIG.timezone
      }));
    }
    
    // Fallback to configured brand
    return [METRICOOL_BRAND];
  } catch (error) {
    console.warn('⚠️ Error fetching brands, using default:', error);
    return [METRICOOL_BRAND];
  }
}

/**
 * Schedule a post to Metricool for a specific platform
 */
export async function schedulePost(
  brandId: number,
  platform: string,
  content: string,
  mediaUrl: string,
  scheduledTime: Date
): Promise<any> {
  // Fixed: Metricool API format with correct structure
  const postData = {
    autoPublish: true,
    providers: [{ network: platform }],
    text: content,
    publicationDate: {
      dateTime: scheduledTime.toISOString().slice(0, 19),
      timezone: METRICOOL_CONFIG.timezone
    },
    shortener: false,
    draft: false,
    info: {} as any
  };

  // Add media URL to info object (required for video/image posts)
  if (mediaUrl && platform !== 'gmb') {
    // Check if mediaUrl is a YouTube URL or uploaded media
    if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
      postData.info.url = mediaUrl; // For YouTube URLs
    } else {
      postData.info.media = [mediaUrl]; // For uploaded media
    }
  }
  
  // For Google Business, URL goes in text content
  if (platform === 'gmb' && mediaUrl) {
    // URL is already included in the content for GMB
  }

  // Add platform-specific data
  switch(platform) {
    case 'instagram':
      postData.info.instagramData = {
        autoPublish: true,
        type: 'POST',
        showReelOnFeed: true
      };
      break;
    case 'facebook':
      postData.info.facebookData = { type: 'POST' };
      break;
    case 'twitter':
      postData.info.twitterData = { type: 'POST' };
      break;
    case 'linkedin':
      postData.info.linkedinData = { 
        type: 'POST',
        previewIncluded: true
      };
      break;
    case 'tiktok':
      postData.info.tiktokData = {
        privacyOption: 'PUBLIC_TO_EVERYONE',
        photoCoverIndex: 0
      };
      break;
    case 'gmb':
      postData.info.gmbData = { type: 'publication' };
      // For GMB, URL goes in text, media is excluded
      break;
  }

  console.log('📊 Scheduling post to Metricool:', { platform, brandId, scheduledTime });
  console.log('📊 Post data:', JSON.stringify(postData, null, 2));
  
  // Fixed: Using correct Metricool API endpoint from your account
  const url = `${METRICOOL_CONFIG.baseURL}/v2/scheduler/posts?userToken=${METRICOOL_CONFIG.userToken}&userId=${METRICOOL_CONFIG.userId}&blogId=${brandId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Mc-Auth': METRICOOL_CONFIG.userToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  });

  // Enhanced response handling with detailed debugging
  const contentType = response.headers.get('content-type');
  let responseData;
  
  try {
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // If not JSON, get as text for debugging
      const textResponse = await response.text();
      console.error('❌ Non-JSON response from Metricool API:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        url: url,
        responsePreview: textResponse.substring(0, 500)
      });
      throw new Error(`Metricool API returned non-JSON response (${response.status}). Response: ${textResponse.substring(0, 200)}`);
    }
  } catch (parseError) {
    console.error('❌ Failed to parse Metricool API response:', parseError);
    throw new Error(`Failed to parse API response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
  
  // Log response for debugging
  console.log('📊 Metricool API Response:', {
    status: response.status,
    statusText: response.statusText,
    url: url,
    responseData: JSON.stringify(responseData, null, 2)
  });
  
  if (!response.ok) {
    console.error('❌ Metricool API error:', {
      status: response.status,
      statusText: response.statusText,
      responseData,
      url: url
    });
    
    // Provide specific error messages based on status code
    let errorMessage = `Metricool API error (${response.status})`;
    if (response.status === 401) {
      errorMessage += ': Authentication failed. Check userToken and credentials.';
    } else if (response.status === 403) {
      errorMessage += ': Access forbidden. Check API permissions and blogId.';
    } else if (response.status === 404) {
      errorMessage += ': Endpoint not found. Check API URL format.';
    } else if (response.status === 400) {
      errorMessage += ': Bad request. Check request format and parameters.';
    }
    
    errorMessage += ` Response: ${responseData.message || JSON.stringify(responseData)}`;
    throw new Error(errorMessage);
  }

  // Check for successful scheduling
  if (responseData.data && responseData.data.id) {
    console.log('✅ Post scheduled successfully:', responseData.data.id);
  } else if (responseData.success) {
    console.log('✅ Post scheduled successfully (no ID returned)');
  } else {
    console.warn('⚠️ Unexpected response format - post may not have been scheduled:', responseData);
  }

  return responseData;
}

/**
 * Upload video file to Metricool for platforms that need direct video
 * Based on working debug guide - use correct URL params
 */
export async function uploadVideoToMetricool(videoFile: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', videoFile);
  // Remove blog_id from form data - it goes in URL params

  console.log('📹 Uploading video to Metricool:', videoFile.name, 'Size:', videoFile.size);

  // Fixed: Correct Metricool API URL format for media upload
  const url = `${METRICOOL_CONFIG.baseURL}/media?userToken=${METRICOOL_CONFIG.userToken}&userId=${METRICOOL_CONFIG.userId}&blogId=${METRICOOL_CONFIG.blogId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Mc-Auth': METRICOOL_CONFIG.userToken
      // Note: Don't set Content-Type for FormData - browser sets it with boundary
    },
    body: formData
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error('❌ Video upload failed:', result);
    throw new Error(`Video upload failed (${response.status}): ${result.message || JSON.stringify(result)}`);
  }

  console.log('✅ Video uploaded successfully:', result);
  
  // Return the media URL (check multiple possible response formats)
  const mediaUrl = result.url || result.media_url || result.data?.url || result.data?.media_url;
  
  if (!mediaUrl) {
    console.warn('⚠️ No media URL in response:', result);
    throw new Error('No media URL returned from upload');
  }
  
  return mediaUrl;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      console.log(`⏳ Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}