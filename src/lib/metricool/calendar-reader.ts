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
   * ✅ NEW: Rate-limited with 7-day chunks to avoid server overload
   */
  async getScheduledPosts(startDate: string, endDate: string): Promise<ScheduledPost[]> {
    try {
      console.log(`📅 Fetching scheduled posts from ${startDate} to ${endDate} (using 7-day chunks)`);
      
      // Split date range into 7-day chunks to avoid server overload
      const allPosts: ScheduledPost[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      const msPerDay = 24 * 60 * 60 * 1000;
      
      // Calculate 7-day chunks
      let currentStart = new Date(start);
      let chunkCount = 0;
      
      while (currentStart < end) {
        chunkCount++;
        const currentEnd = new Date(Math.min(
          currentStart.getTime() + (7 * msPerDay) - 1, // 7 days minus 1ms
          end.getTime()
        ));
        
        const chunkStartStr = currentStart.toISOString().split('T')[0];
        const chunkEndStr = currentEnd.toISOString().split('T')[0];
        
        console.log(`📊 Chunk ${chunkCount}: ${chunkStartStr} to ${chunkEndStr}`);
        
        // Add delay between requests to avoid rate limiting
        if (chunkCount > 1) {
          console.log('⏳ Rate limiting: 500ms delay between requests...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const chunkPosts = await this.fetchPostsChunk(chunkStartStr, chunkEndStr);
        allPosts.push(...chunkPosts);
        
        // Move to next chunk
        currentStart = new Date(currentEnd.getTime() + 1); // Next day
      }
      
      console.log(`✅ Total posts retrieved across ${chunkCount} chunks: ${allPosts.length}`);
      
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
   * Fetch posts for a single 7-day chunk
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
    
    // Generate smart recommendations with WATERFLOW insights
    if (analysis.totalScheduled === 0) {
      analysis.recommendations.push('📈 Calendar is clear - optimal time to schedule posts');
    } else {
      analysis.recommendations.push(`📊 Found ${analysis.totalScheduled} existing posts in next ${daysAhead} days`);
      
      // Analyze waterflow distribution
      const weeksAnalyzed = Math.ceil(daysAhead / 7);
      const avgPostsPerWeek = analysis.totalScheduled / weeksAnalyzed;
      const postsPerDay = Object.values(analysis.dailyBreakdown);
      const minPostsPerDay = postsPerDay.length > 0 ? Math.min(...postsPerDay.filter(p => p > 0)) : 0;
      const maxPostsPerDay = postsPerDay.length > 0 ? Math.max(...postsPerDay) : 0;
      
      analysis.recommendations.push(`💧 CASCADE: ${minPostsPerDay}-${maxPostsPerDay} posts/day (higher density near current week)`);
      analysis.recommendations.push(`📅 Pattern: Week 1 fills first, then pushes to Week 2, etc.`);
      
      // Find busy days (3+ posts per day)
      const busyDays = Object.entries(analysis.dailyBreakdown)
        .filter(([date, count]) => count >= 3)
        .map(([date, count]) => `${date} (${count} posts)`);
        
      if (busyDays.length > 0) {
        analysis.recommendations.push(`⚠️ Consider avoiding busy days: ${busyDays.join(', ')}`);
      }
      
      // Find optimal time slots
      const timeSlotEntries = Object.entries(analysis.timeSlots);
      if (timeSlotEntries.length > 0) {
        const leastBusySlot = timeSlotEntries.reduce((a, b) => a[1] < b[1] ? a : b);
        analysis.recommendations.push(`⏰ Least busy time slot: ${leastBusySlot[0]} (${leastBusySlot[1]} posts)`);
      }
      
      // Platform distribution recommendations
      const platformEntries = Object.entries(analysis.platformBreakdown);
      if (platformEntries.length > 0) {
        const leastUsedPlatform = platformEntries.reduce((a, b) => a[1] < b[1] ? a : b);
        analysis.recommendations.push(`📱 Least used platform: ${leastUsedPlatform[0]} (${leastUsedPlatform[1]} posts)`);
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
   * Calculate optimal posting time using CASCADE WATERFLOW scheduling
   * Builds content density from current week, pushing overflow forward
   */
  calculateOptimalTime(analysis: CalendarAnalysis): string {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Start from tomorrow
    
    // ✅ CASCADE WATERFLOW: Analyze weeks in cascading pattern
    const weeksToAnalyze = 10;
    const weekData: Array<{
      weekNumber: number;
      days: Array<{
        date: string;
        posts: number;
        dateObj: Date;
        dayOfWeek: number;
      }>;
      minPosts: number;
      maxPosts: number;
      avgPosts: number;
    }> = [];
    
    // Build week data structure
    for (let week = 0; week < weeksToAnalyze; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dayIndex = week * 7 + day;
        const date = new Date(tomorrow.getTime() + (dayIndex * 24 * 60 * 60 * 1000));
        const dateStr = date.toISOString().split('T')[0];
        const postsOnDate = analysis.dailyBreakdown[dateStr] || 0;
        
        weekDays.push({
          date: dateStr,
          posts: postsOnDate,
          dateObj: date,
          dayOfWeek: date.getDay()
        });
      }
      
      const weekPosts = weekDays.map(d => d.posts);
      weekData.push({
        weekNumber: week,
        days: weekDays,
        minPosts: Math.min(...weekPosts),
        maxPosts: Math.max(...weekPosts),
        avgPosts: weekPosts.reduce((a, b) => a + b, 0) / 7
      });
    }
    
    // CASCADE LOGIC: Determine target posts per week based on cascade pattern
    // Example: Week 0: 3/day, Week 1: 2/day, Week 2: 1/day, Week 3+: 1/day
    let optimalDay = null;
    let targetWeek = null;
    
    // First, check if any week in the cascade needs filling
    for (let weekIndex = 0; weekIndex < weekData.length; weekIndex++) {
      const week = weekData[weekIndex];
      let targetPostsForWeek = 1; // Default minimum
      
      // CASCADE PATTERN: Further out = fewer posts per day
      if (weekIndex === 0) {
        // Current week: Find the lowest day, but aim for higher density
        targetPostsForWeek = Math.max(1, week.minPosts);
      } else if (weekIndex === 1) {
        // Next week: Should have fewer posts than current week
        const currentWeekMin = weekData[0].minPosts;
        targetPostsForWeek = Math.max(1, currentWeekMin - 1);
      } else if (weekIndex === 2) {
        // Two weeks out: Even fewer posts
        const week1Min = weekData[1].minPosts;
        targetPostsForWeek = Math.max(1, week1Min - 1);
      } else {
        // Three+ weeks out: Single posts until cascade builds
        targetPostsForWeek = 1;
      }
      
      // Find days in this week that need posts
      const daysNeedingPosts = week.days
        .filter(day => day.posts < targetPostsForWeek)
        .sort((a, b) => {
          // Sort by posts first, then by day of week
          if (a.posts !== b.posts) return a.posts - b.posts;
          return a.dayOfWeek - b.dayOfWeek;
        });
      
      if (daysNeedingPosts.length > 0) {
        optimalDay = daysNeedingPosts[0];
        targetWeek = weekIndex;
        break;
      }
    }
    
    // If no optimal day found (all weeks are at capacity), find absolute minimum
    if (!optimalDay) {
      const allDays = weekData.flatMap(w => w.days);
      allDays.sort((a, b) => {
        if (a.posts !== b.posts) return a.posts - b.posts;
        return a.dateObj.getTime() - b.dateObj.getTime();
      });
      optimalDay = allDays[0];
      targetWeek = Math.floor(allDays.indexOf(optimalDay) / 7);
    }
    
    console.log(`💧 CASCADE WATERFLOW Analysis:`, {
      targetWeek: targetWeek + 1,
      weekPattern: weekData.slice(0, 5).map((w, i) => 
        `Week ${i + 1}: ${w.minPosts}-${w.maxPosts} posts/day`
      ),
      selectedDate: optimalDay.date,
      currentPosts: optimalDay.posts,
      cascadeDepth: `Scheduling in week ${targetWeek + 1}`
    });
    
    // Create proper EDT time for the optimal day
    const edtOptimalTime = new Date(optimalDay.dateObj);
    
    // Stagger times based on existing posts to avoid conflicts
    const baseHour = 10; // Start at 10 AM
    const hoursOffset = (optimalDay.posts % 3) * 2; // 0, 2, or 4 hours offset
    edtOptimalTime.setHours(baseHour + hoursOffset, 0, 0, 0);
    
    console.log(`⏰ CASCADE optimal time: ${edtOptimalTime.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })} (${optimalDay.posts} existing posts, CASCADE Week ${targetWeek + 1})`);
    
    // Return the EDT time object that will display correctly
    return edtOptimalTime.toISOString();
  }

  /**
   * Get calendar data for UI display (4 weeks)
   */
  async getCalendarDisplayData(): Promise<{
    posts: ScheduledPost[];
    analysis: CalendarAnalysis;
    optimalTime: string;
  }> {
    try {
      console.log('📅 Preparing calendar display data...');
      
      const analysis = await this.analyzeCalendarForPlanning(70); // 10 weeks for complete waterflow coverage
      const posts = await this.getScheduledPosts(
        analysis.dateRange.start,
        analysis.dateRange.end
      );
      const optimalTime = this.calculateOptimalTime(analysis);
      
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