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
  youtubeMetadata?: any,
  useDropboxVideo?: boolean
): string {
  // Extract manufacturer name from vessel name
  const manufacturer = vesselName.split(' ')[0];
  
  // Enhanced content with better calls to action and contact info
  const baseContent = {
    title: `${vesselName} - Luxury Yacht Tour`,
    description: youtubeMetadata?.description?.split('\n')[0] || `🛥️ Experience the luxury of ${vesselName}`,
    // Enhanced contact info with multiple channels
    contactFull: `📲 Contact for Specs, Pricing & Availability:\n📞 Tony Smith – Call/Text/WhatsApp: +1 (404) 805-9819\n📩 Email: TS@MintedYachts.com\n🌐 Visit: YachtSpecsDirect.com`,
    contactShort: `📞 Tony Smith: +1 (404) 805-9819\n🌐 YachtSpecsDirect.com`,
    // Platform-optimized hashtags
    hashtagsBasic: '#yacht #luxury #yachtlife #marine #boat #vessel #florida',
    hashtagsPro: `#${manufacturer}Yachts #LuxuryYacht #YachtLife #YachtingLifestyle #SuperYacht #YachtForSale #FloridaYachts #YachtBroker`,
    hashtagsTikTok: '#yachttok #luxurylifestyle #yachting #boatlife #millionairelifestyle #dreamboat #yachtvibes',
    // Call to action variations
    ctaInquire: '🔥 Inquire Now for Exclusive Viewing!',
    ctaSchedule: '📅 Schedule Your Private Tour Today!',
    ctaContact: '💼 Contact Us for Full Specs & Pricing'
  };
  
  // Platform-specific formatting with character limits
  switch(platform) {
    case 'twitter':
      // 280 char limit - always includes YouTube URL
      const twitterContent = [
        `🛥️ ${vesselName}`,
        '',
        youtubeUrl,
        '',
        `${baseContent.ctaInquire}`,
        `📞 ${manufacturer} Expert: (404) 805-9819`,
        '',
        `#${manufacturer}Yachts #YachtForSale #LuxuryYacht`
      ].join('\n');
      
      return twitterContent.length > 280 ? twitterContent.substring(0, 277) + '...' : twitterContent;
      
    case 'instagram':
      // 2,200 chars - no clickable links, rich content
      return [
        `🛥️ ${baseContent.title}`,
        '',
        baseContent.description,
        '',
        '⚓ Key Features:',
        `✨ ${manufacturer} Build Quality`,
        '🌊 Perfect for Florida Waters',
        '🛋️ Luxurious Interior Design',
        '⚡ High Performance Engineering',
        '',
        baseContent.ctaSchedule,
        '',
        baseContent.contactFull,
        '',
        baseContent.hashtagsPro,
        `#${vesselName.replace(/\s+/g, '')}`,
        '#YachtSpecsDirect #MintedYachts'
      ].join('\n');
      
    case 'linkedin':
      // 3,000 chars - professional tone, NO YouTube URL if using Dropbox
      const linkedinContent = [
        `🛥️ ${baseContent.title}`,
        '',
        `Presenting an exceptional ${manufacturer} yacht available for immediate viewing.`,
        '',
        baseContent.description,
        '',
        '🔍 Why Choose This Yacht:',
        `• Premium ${manufacturer} construction and design`,
        '• Ideal for both leisure cruising and entertaining',
        '• Comprehensive specifications available upon request',
        '• Professional yacht brokerage services',
        '',
        baseContent.ctaContact,
        '',
        baseContent.contactFull,
        '',
        // Only add YouTube URL if NOT using Dropbox video
        ...(useDropboxVideo ? [] : ['Watch the full tour:', youtubeUrl, '']),
        '#YachtBrokerage #LuxuryYachts #MarineIndustry #YachtSales',
        `#${manufacturer} #YachtingBusiness #FloridaYachts`
      ].filter(Boolean).join('\n');
      
      return linkedinContent;
      
    case 'facebook':
      // 1,500 char limit - engaging, NO YouTube URL if using Dropbox
      const facebookContent = [
        `🛥️ ${baseContent.title} 🛥️`,
        '',
        baseContent.description,
        '',
        `✨ This stunning ${manufacturer} yacht is now available for viewing!`,
        '',
        '👀 What Makes This Special:',
        '• Exceptional build quality',
        '• Luxurious amenities throughout',
        '• Perfect for the Florida lifestyle',
        '• Professional maintenance history',
        '',
        baseContent.ctaSchedule,
        '',
        baseContent.contactFull,
        '',
        // Only add YouTube URL if NOT using Dropbox video
        ...(useDropboxVideo ? [] : ['🎥 Watch the full tour:', youtubeUrl, '']),
        baseContent.hashtagsPro
      ].filter(Boolean).join('\n');
      
      return facebookContent;
      
    case 'gmb':
      // Google Business - 1,500 chars, YouTube URL required
      return [
        youtubeUrl,
        '',
        `🛥️ ${baseContent.title}`,
        '',
        `Visit YachtSpecsDirect.com for luxury ${manufacturer} yachts in Florida.`,
        '',
        baseContent.description,
        '',
        '📍 Serving South Florida Yacht Market',
        '⭐ Professional Yacht Brokerage Services',
        '🔍 Full Specifications Available',
        '',
        baseContent.contactFull,
        '',
        'Business Hours: Mon-Sat 9AM-6PM EST'
      ].join('\n');
      
    case 'tiktok':
      // 2,200 chars - trendy, engaging
      return [
        `POV: You just found your dream ${manufacturer} yacht 🛥️✨`,
        '',
        baseContent.description,
        '',
        '💎 Why You Need This:',
        '• Living the yacht life in Florida 🌴',
        '• Perfect for those sunset cruises 🌅',
        '• Luxury that turns heads 👀',
        '• Your floating paradise awaits 🏝️',
        '',
        '🔥 This beauty won\'t last long!',
        '',
        baseContent.ctaInquire,
        '',
        `📱 Call/Text: (404) 805-9819`,
        '🌐 YachtSpecsDirect.com',
        '',
        baseContent.hashtagsTikTok,
        `#${manufacturer}Yacht #FloridaLife`
      ].join('\n');
      
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
 * Determine if should use YouTube URL vs Dropbox share link for platform
 * Based on platform requirements (not file size - Dropbox handles large files)
 */
export function shouldUseYouTubeUrl(platform: string, videoPath?: string, videoSize?: number): boolean {
  // Twitter: 60-second limit - always use YouTube URL
  // Google Business: Always use YouTube URLs (per requirements)
  if (platform === 'twitter' || platform === 'gmb') {
    return true;
  }
  
  // All other platforms (Instagram, Facebook, LinkedIn, TikTok) should try Dropbox first
  // Dropbox handles large files perfectly (up to 50GB) with dl=1 parameter
  // Only fallback to YouTube if Dropbox share link generation fails
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
  // FIXED: Correct Metricool API format - remove "info" field that's causing errors
  const postData = {
    autoPublish: true,
    providers: [{ network: platform }],
    text: content,
    publicationDate: {
      dateTime: scheduledTime.toISOString().slice(0, 19),
      timezone: METRICOOL_CONFIG.timezone
    },
    shortener: false,
    draft: false
  } as any;

  // Add media URL directly to post data (not in "info" object)
  // Note: For platforms like Twitter, YouTube URLs are included in the text content
  // Only add media field for actual uploaded video files
  if (mediaUrl && platform !== 'gmb' && !mediaUrl.includes('youtube.com') && !mediaUrl.includes('youtu.be')) {
    postData.media = [mediaUrl]; // For uploaded media only
  }

  // Add platform-specific data directly to postData (not in "info")
  switch(platform) {
    case 'instagram':
      postData.instagramData = {
        autoPublish: true,
        type: 'POST',
        showReelOnFeed: true
      };
      break;
    case 'facebook':
      postData.facebookData = { type: 'POST' };
      break;
    case 'twitter':
      postData.twitterData = { type: 'POST' };
      break;
    case 'linkedin':
      postData.linkedinData = { 
        type: 'POST',
        previewIncluded: true
      };
      break;
    case 'tiktok':
      postData.tiktokData = {
        privacyOption: 'PUBLIC_TO_EVERYONE',
        photoCoverIndex: 0
      };
      break;
    case 'gmb':
      postData.gmbData = { type: 'publication' };
      // For GMB, URL is already in text content
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
 * Enhanced error handling and multiple endpoint attempts
 */
export async function uploadVideoToMetricool(videoFile: File): Promise<string> {
  // Check file size limit (200MB for initial attempt)
  // Note: If this fails, we'll fall back to YouTube URLs
  const maxSize = 200 * 1024 * 1024; // 200MB
  if (videoFile.size > maxSize) {
    console.warn(`⚠️ Video too large: ${Math.round(videoFile.size / 1024 / 1024)}MB > 200MB limit`);
    throw new Error(`Video file too large: ${Math.round(videoFile.size / 1024 / 1024)}MB exceeds 200MB limit`);
  }

  const formData = new FormData();
  formData.append('file', videoFile);

  console.log('📹 Uploading video to Metricool:', videoFile.name, 'Size:', Math.round(videoFile.size / 1024 / 1024) + 'MB');

  // Try different possible endpoints
  const endpoints = [
    `${METRICOOL_CONFIG.baseURL}/v2/media?userToken=${METRICOOL_CONFIG.userToken}&userId=${METRICOOL_CONFIG.userId}&blogId=${METRICOOL_CONFIG.blogId}`,
    `${METRICOOL_CONFIG.baseURL}/v1/media?userToken=${METRICOOL_CONFIG.userToken}&userId=${METRICOOL_CONFIG.userId}&blogId=${METRICOOL_CONFIG.blogId}`,
    `${METRICOOL_CONFIG.baseURL}/v2/media/upload?userToken=${METRICOOL_CONFIG.userToken}&userId=${METRICOOL_CONFIG.userId}&blogId=${METRICOOL_CONFIG.blogId}`
  ];

  let lastError;
  
  for (const url of endpoints) {
    try {
      console.log(`🔄 Trying endpoint: ${url.split('?')[0]}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Mc-Auth': METRICOOL_CONFIG.userToken
        },
        body: formData
      });

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const textResult = await response.text();
        console.warn('⚠️ Non-JSON response:', textResult.substring(0, 200));
        throw new Error(`Non-JSON response: ${textResult.substring(0, 100)}`);
      }
      
      if (response.ok) {
        console.log('✅ Video uploaded successfully via:', url.split('?')[0]);
        
        // Return the media URL (check multiple possible response formats)
        const mediaUrl = result.url || result.media_url || result.data?.url || result.data?.media_url || result.file_url;
        
        if (!mediaUrl) {
          console.warn('⚠️ No media URL in successful response:', result);
          throw new Error('No media URL in response despite success status');
        }
        
        return mediaUrl;
      } else {
        lastError = new Error(`HTTP ${response.status}: ${result.message || JSON.stringify(result)}`);
        console.warn(`⚠️ Endpoint failed with ${response.status}:`, result);
      }
      
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Endpoint error:`, error instanceof Error ? error.message : error);
    }
  }
  
  // If all endpoints failed, throw the last error
  console.error('❌ All upload endpoints failed:', lastError);
  throw lastError || new Error('Video upload failed - all endpoints exhausted');
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