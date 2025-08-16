/**
 * Metricool Calendar Reader - READ ONLY Implementation
 * Based on Claude Desktop guide for reading scheduled posts
 * CRITICAL: Does NOT modify posting workflow - only reads calendar data
 */

import { METRICOOL_CONFIG } from './config';

export interface ScheduledPost {
  id: string;
  publicationDate: {
    dateTime: string;
    timezone: string;
  };
  text: string;
  providers: Array<{
    network: string;
    status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  }>;
  autoPublish: boolean;
  media?: string[];
}

export interface CalendarAnalysis {
  totalScheduled: number;
  dateRange: { start: string; end: string };
  platformBreakdown: Record<string, number>;
  dailyBreakdown: Record<string, number>;
  timeSlots: Record<string, number>;
  recommendations: string[];
}

export class MetricoolCalendarReader {
  private config = METRICOOL_CONFIG;
  
  // ✅ OPTIMIZATION: Simple cache to eliminate duplicate API calls
  private cache: Map<string, { data: ScheduledPost[]; timestamp: number }> = new Map();
  private cacheExpiryMs = 5 * 60 * 1000; // 5 minutes
  private baseURL = METRICOOL_CONFIG.baseURL;
  private headers = {
    'X-Mc-Auth': METRICOOL_CONFIG.userToken,
    'Content-Type': 'application/json'
  };

  constructor() {
    console.log('📅 Initializing Metricool Calendar Reader...');
  }

  /**
   * Test API connection - matches existing pattern from project
   */
  async testConnection(): Promise<any> {
    try {
      console.log('🔍 Testing Metricool API connection...');
      
      const response = await fetch(`${this.baseURL}/admin/simpleProfiles`, {
        method: 'GET',
        headers: this.headers,
        // Add timeout for connection test
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ API connection successful');
      return data;
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      throw new Error(`Metricool API Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get scheduled posts - READ ONLY for planning
   * ✅ OPTIMIZED: Single API call eliminates chunking overhead
   * ✅ CACHE BUSTING: Forces fresh data from Metricool API
   */
  async getScheduledPosts(startDate: string, endDate: string, forceFresh: boolean = false): Promise<ScheduledPost[]> {
    try {
      const freshIndicator = forceFresh ? ' (FORCE FRESH)' : '';
      console.log(`📅 Fetching scheduled posts from ${startDate} to ${endDate} (single optimized call)${freshIndicator}`);
      
      // ✅ OPTIMIZATION: Check cache first unless forcing fresh data
      const cacheKey = `${startDate}-${endDate}`;
      const cachedData = this.cache.get(cacheKey);
      const now = Date.now();
      
      if (!forceFresh && cachedData && (now - cachedData.timestamp) < this.cacheExpiryMs) {
        console.log(`📦 Using cached data for ${startDate} to ${endDate} (${cachedData.data.length} posts)`);
        return cachedData.data;
      }
      
      if (forceFresh) {
        console.log('🔄 CACHE BUSTING: Forcing fresh data from Metricool API...');
        // Clear cache when forcing fresh data
        this.cache.clear();
        // Add small delay to allow Metricool's systems to propagate new data
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
      
      // ✅ OPTIMIZATION: Single API call instead of chunking
      const allPosts = await this.fetchPostsOptimized(startDate, endDate);
      
      // ✅ OPTIMIZATION: Cache the result
      this.cache.set(cacheKey, { data: allPosts, timestamp: now });
      
      console.log(`✅ Total posts retrieved in single call: ${allPosts.length}`);
      
      // ✅ Show date range of all retrieved posts
      const postDates = allPosts.map(p => p.publicationDate?.dateTime?.split('T')[0]).filter(Boolean);
      const uniqueDates = [...new Set(postDates)].sort();
      console.log(`📅 Posts span dates:`, uniqueDates.slice(0, 10), uniqueDates.length > 10 ? `... +${uniqueDates.length - 10} more` : '');
      
      return allPosts;
      
    } catch (error) {
      console.error('❌ Failed to get scheduled posts:', error);
      return [];
    }
  }

  /**
   * ✅ OPTIMIZED: Single API call for large date ranges
   * Replaces chunking approach with single efficient call
   */
  private async fetchPostsOptimized(startDate: string, endDate: string): Promise<ScheduledPost[]> {
    try {
      // ✅ OPTIMIZATION: Convert date to datetime format as required by API
      const startDateTime = `${startDate}T00:00:00`;
      const endDateTime = `${endDate}T23:59:59`;
      
      console.log(`🚀 OPTIMIZED: Single API call for ${startDate} to ${endDate}`);
      
      // Use primary working endpoint with optimized parameters
      const endpoint = `${this.config.baseURL}/v2/scheduler/posts`;
      const url = new URL(endpoint);
      
      // ✅ OPTIMIZED: Single large request instead of chunking
      url.searchParams.append('blog_id', this.config.blogId.toString());
      url.searchParams.append('start', startDateTime);
      url.searchParams.append('end', endDateTime);
      url.searchParams.append('timezone', 'America/New_York');
      url.searchParams.append('limit', '1000'); // ✅ INCREASED: Handle large numbers of posts
      url.searchParams.append('page', '1');
      
      // Add cache busting parameter to force fresh data
      url.searchParams.append('_t', Date.now().toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.headers
      });

      if (response.ok) {
        const responseData = await response.json();
        const posts = responseData?.data || [];
        console.log(`✅ Retrieved ${posts.length} posts from ${endpoint} (${startDate} to ${endDate})`);
        return posts;
      } else {
        console.error(`❌ API call failed: ${response.status} ${response.statusText}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error in optimized fetch:`, error);
      return [];
    }
  }

  /**
   * Fetch posts for a single 7-day chunk (LEGACY - kept for fallback)
   */
  private async fetchPostsChunk(startDate: string, endDate: string): Promise<ScheduledPost[]> {
    try {
      // ✅ FIXED: Convert date to datetime format as required by API
      const startDateTime = `${startDate}T00:00:00`;
      const endDateTime = `${endDate}T23:59:59`;
      
      // Try multiple endpoint variations - prioritize v2/scheduler/posts (working per Claude Desktop)
      const endpoints = [
        // Primary working endpoint per Claude Desktop
        `${this.baseURL}/v2/scheduler/posts`,
        // Alternative endpoints to try
        `${this.baseURL}/calendar/posts`,
        `${this.baseURL}/scheduler/posts`
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint} for ${startDate} to ${endDate}`);
          
          const url = new URL(endpoint);
          // ✅ Use smaller limit per chunk to avoid server stress
          url.searchParams.append('blog_id', this.config.blogId.toString());
          url.searchParams.append('start', startDateTime);
          url.searchParams.append('end', endDateTime);
          url.searchParams.append('timezone', 'America/New_York');
          url.searchParams.append('limit', '100'); // Increased: 100 posts per 7-day period
          url.searchParams.append('page', '1');
          
          // Add cache busting parameter to force fresh data
          url.searchParams.append('_t', Date.now().toString());
          
          const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.headers
          });

          if (response.ok) {
            const data = await response.json();
            const posts = data.data || data || [];
            
            if (Array.isArray(posts)) {
              console.log(`✅ Retrieved ${posts.length} posts from ${endpoint} (${startDate} to ${endDate})`);
              return posts;
            } else {
              console.log(`⚠️ Endpoint ${endpoint} returned non-array data for chunk`);
            }
          } else {
            console.log(`❌ Endpoint ${endpoint} failed: ${response.status} for chunk ${startDate}-${endDate}`);
            if (response.status === 400) {
              try {
                const errorText = await response.text();
                console.log(`📋 400 Error details:`, errorText);
              } catch (e) {
                console.log(`📋 Could not read 400 error response`);
              }
            }
          }
        } catch (endpointError) {
          console.log(`❌ Endpoint ${endpoint} error for chunk:`, endpointError);
        }
      }

      // All endpoints failed for this chunk
      console.log(`📊 No posts found for chunk ${startDate} to ${endDate}`);
      return [];
      
    } catch (error) {
      console.error(`❌ Failed to fetch chunk ${startDate} to ${endDate}:`, error);
      return [];
    }
  }

  /**
   * Smart calendar analysis for planning - following guide pattern
   */
  async analyzeCalendarForPlanning(daysAhead: number = 70): Promise<CalendarAnalysis> {
    const today = new Date();
    const endDate = new Date(today.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
    
    const startDateStr = today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`🧠 Analyzing calendar from ${startDateStr} to ${endDateStr}`);
    
    const scheduledPosts = await this.getScheduledPosts(startDateStr, endDateStr);
    
    // Initialize analysis object
    const analysis: CalendarAnalysis = {
      totalScheduled: scheduledPosts.length,
      dateRange: { start: startDateStr, end: endDateStr },
      platformBreakdown: {},
      dailyBreakdown: {},
      timeSlots: {},
      recommendations: []
    };
    
    // Analyze existing posts for smart planning
    scheduledPosts.forEach(post => {
      // Group by platform
      if (post.providers) {
        post.providers.forEach(provider => {
          const network = provider.network.toLowerCase();
          analysis.platformBreakdown[network] = (analysis.platformBreakdown[network] || 0) + 1;
        });
      }
      
      // Group by date
      if (post.publicationDate?.dateTime) {
        const date = post.publicationDate.dateTime.split('T')[0];
        analysis.dailyBreakdown[date] = (analysis.dailyBreakdown[date] || 0) + 1;
        
        // Group by time slots
        const hour = new Date(post.publicationDate.dateTime).getHours();
        const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        analysis.timeSlots[timeSlot] = (analysis.timeSlots[timeSlot] || 0) + 1;
      }
    });
    
    // Generate smart recommendations with CASCADING SCHEDULER insights
    if (analysis.totalScheduled === 0) {
      analysis.recommendations.push('📈 Calendar is clear - optimal time to schedule posts');
    } else {
      analysis.recommendations.push(`📊 Found ${analysis.totalScheduled} existing posts in next ${daysAhead} days`);
      
      // Analyze platform distribution
      const platformEntries = Object.entries(analysis.platformBreakdown);
      if (platformEntries.length > 0) {
        const topPlatform = platformEntries.reduce((a, b) => a[1] > b[1] ? a : b);
        const avgPostsPerPlatform = analysis.totalScheduled / platformEntries.length;
        analysis.recommendations.push(`📱 Most active platform: ${topPlatform[0]} (${topPlatform[1]} posts)`);
      }
      
      // Analyze posting patterns for cascade scheduling
      const postsPerDay = Object.values(analysis.dailyBreakdown);
      const maxPostsPerDay = postsPerDay.length > 0 ? Math.max(...postsPerDay) : 0;
      const avgTopicsPerDay = maxPostsPerDay / 6; // Assuming 6 platforms per topic
      
      analysis.recommendations.push(`🌊 2-WEEK CASCADE: ~${Math.ceil(avgTopicsPerDay)} topics/day pattern detected`);
      analysis.recommendations.push(`📅 Fill 14 days with 1 topic before any day gets 2 topics (prevents tripling up)`);
      
      // Find busy days for topic scheduling
      const busyDays = Object.entries(analysis.dailyBreakdown)
        .filter(([date, count]) => count >= 12) // 12+ posts = 2+ topics
        .map(([date, count]) => `${date} (${Math.floor(count/6)} topics)`);
        
      if (busyDays.length > 0) {
        analysis.recommendations.push(`✅ High activity days: ${busyDays.slice(0, 5).join(', ')}`);
      }
      
      // Find gaps in the 2-week cascade
      const today = new Date().toISOString().split('T')[0];
      const next14Days = [];
      for (let i = 0; i < 14; i++) { // Changed to 14 days
        const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const postCount = analysis.dailyBreakdown[date] || 0;
        const topicCount = Math.floor(postCount / 6);
        next14Days.push({ date, topics: topicCount });
      }
      
      const emptyDays = next14Days.filter(d => d.topics === 0);
      const minTopics = Math.min(...next14Days.map(d => d.topics));
      
      if (emptyDays.length > 0) {
        const nearestEmpty = emptyDays[0];
        analysis.recommendations.push(`🎯 Priority: Fill empty day ${nearestEmpty.date} (${emptyDays.length} empty days remain)`);
      } else {
        const leastBusyDays = next14Days.filter(d => d.topics === minTopics);
        analysis.recommendations.push(`🚀 Add to least busy day: ${leastBusyDays[0].date} (${minTopics} topics)`);
      }
      
      // Time slot analysis
      const timeSlotEntries = Object.entries(analysis.timeSlots);
      if (timeSlotEntries.length > 0) {
        const leastBusySlot = timeSlotEntries.reduce((a, b) => a[1] < b[1] ? a : b);
        analysis.recommendations.push(`⏰ Optimal time window: ${leastBusySlot[0]} (${leastBusySlot[1]} posts)`);
      }
    }
    
    console.log('📊 Calendar analysis complete:', {
      total: analysis.totalScheduled,
      recommendations: analysis.recommendations.length
    });
    
    // ✅ NEW: Debug daily breakdown to see which dates have posts
    console.log('📅 Daily breakdown:', analysis.dailyBreakdown);
    
    return analysis;
  }

  /**
   * Calculate optimal posting time using ADAPTIVE CASCADE WATERFALL LOGIC
   * ✅ FIXED: Checks ACTUAL calendar and adapts to achieve cascade pattern
   * 
   * Ideal Pattern:
   * Week 1: 1→2→3→4 posts/day (builds up)
   * Week 2: 0→1→2→3 posts/day (cascades from Week 1)
   * Week 3: 0→0→1→2 posts/day (cascades from Week 2)
   * Week 4: 0→0→0→1 posts/day (cascades from Week 3)
   */
  async calculateOptimalTime(analysis: CalendarAnalysis): Promise<string> {
    console.log(`🌊 CASCADE: Using CascadingScheduler for Smart Insights to match actual posting logic`);
    
    // ✅ USE THE SAME LOGIC AS ACTUAL POSTING: Import and use CascadingScheduler
    const { CascadingScheduler } = await import('./cascading-scheduler');
    const cascadeScheduler = new CascadingScheduler(this);
    
    // Get the same decision that actual posting would use
    const cascadeDecision = await cascadeScheduler.getNextAction();
    
    console.log(`🌊 CASCADE Final Decision:`, {
      selectedDate: cascadeDecision.date,
      currentPosts: cascadeDecision.currentTopics * 6, // Convert topics to posts  
      targetPosts: cascadeDecision.newLevel * 6,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][cascadeDecision.dateObj.getDay()]
    });
    
    return this.setOptimalTime(cascadeDecision.dateObj, cascadeDecision.currentTopics);
  }
  
  /**
   * Set optimal posting time with staggered scheduling
   */
  private setOptimalTime(dateObj: Date, existingPosts: number): string {
    const edtOptimalTime = new Date(dateObj);
    
    // Stagger times throughout the day: 10am, 1pm, 6pm
    const timeSlots = [10, 13, 18]; // 10 AM, 1 PM, 6 PM
    const selectedHour = timeSlots[existingPosts % timeSlots.length];
    
    edtOptimalTime.setHours(selectedHour, 0, 0, 0);
    
    console.log(`⏰ WATERFALL CASCADE optimal time: ${edtOptimalTime.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })} (Post #${existingPosts + 1} of day)`);
    
    return edtOptimalTime.toISOString();
  }

  /**
   * Get calendar data for UI display (4 weeks)
   */
  async getCalendarDisplayData(forceFresh: boolean = false): Promise<{
    posts: ScheduledPost[];
    analysis: CalendarAnalysis;
    optimalTime: string;
  }> {
    try {
      const freshIndicator = forceFresh ? ' (FORCE FRESH)' : '';
      console.log(`📅 Preparing calendar display data${freshIndicator}...`);
      
      const analysis = await this.analyzeCalendarForPlanning(70); // 10 weeks for complete waterflow coverage
      const posts = await this.getScheduledPosts(
        analysis.dateRange.start,
        analysis.dateRange.end,
        forceFresh // Pass through force fresh flag
      );
      const optimalTime = await this.calculateOptimalTime(analysis);
      
      return {
        posts,
        analysis,
        optimalTime
      };
    } catch (error) {
      console.error('❌ Error preparing calendar display data:', error);
      
      // Return safe fallback data
      const today = new Date();
      const endDate = new Date(today.getTime() + (28 * 24 * 60 * 60 * 1000));
      
      return {
        posts: [],
        analysis: {
          totalScheduled: 0,
          dateRange: { 
            start: today.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          },
          platformBreakdown: {},
          dailyBreakdown: {},
          timeSlots: {},
          recommendations: ['📅 Calendar data unavailable - using conservative scheduling']
        },
        optimalTime: (() => {
          // ✅ FIXED: Fallback time also in EDT (10 AM local time tomorrow)
          const tomorrow = new Date(Date.now() + 24*60*60*1000);
          tomorrow.setHours(10, 0, 0, 0); // 10:00 AM local time
          return tomorrow.toISOString(); // Return as local time for UI display
        })()
      };
    }
  }
}

// Export singleton instance
export const metricoolCalendar = new MetricoolCalendarReader();