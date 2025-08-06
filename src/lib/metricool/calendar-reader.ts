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
      
      analysis.recommendations.push(`🌊 4-WEEK ROLLING CASCADE: ${minPostsPerDay}-${maxPostsPerDay} posts/day (backward flow)`);
      analysis.recommendations.push(`📅 Pattern: Gen 1→Week 4, Gen 2→Weeks 3&4, Gen 3→Weeks 2&3&4, Gen 4→All weeks`);
      
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
   * Calculate optimal posting time using ADAPTIVE CASCADE WATERFALL LOGIC
   * ✅ FIXED: Checks ACTUAL calendar and adapts to achieve cascade pattern
   * 
   * Ideal Pattern:
   * Week 1: 1→2→3→4 posts/day (builds up)
   * Week 2: 0→1→2→3 posts/day (cascades from Week 1)
   * Week 3: 0→0→1→2 posts/day (cascades from Week 2)
   * Week 4: 0→0→0→1 posts/day (cascades from Week 3)
   */
  calculateOptimalTime(analysis: CalendarAnalysis): string {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    console.log(`🌊 CASCADE: Analyzing ${analysis.totalScheduled} total posts across ${Object.keys(analysis.dailyBreakdown).length} days`);
    
    // ✅ STEP 1: Analyze the ACTUAL calendar for next 4 weeks
    const weeksToAnalyze = 4;
    const weekAnalysis: Array<{
      weekNumber: number;
      startDate: Date;
      days: Array<{
        date: string;
        dateObj: Date;
        currentPosts: number;
        targetPosts: number;
        needsPosts: number;
      }>;
      totalCurrent: number;
      totalTarget: number;
      totalNeeded: number;
    }> = [];
    
    // Build week-by-week analysis
    for (let weekIndex = 0; weekIndex < weeksToAnalyze; weekIndex++) {
      const weekDays = [];
      const weekStartOffset = weekIndex * 7 * 24 * 60 * 60 * 1000;
      const weekStart = new Date(tomorrow.getTime() + weekStartOffset);
      
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayOffset = dayIndex * 24 * 60 * 60 * 1000;
        const date = new Date(weekStart.getTime() + dayOffset);
        const dateStr = date.toISOString().split('T')[0];
        const currentPosts = analysis.dailyBreakdown[dateStr] || 0;
        
        // Calculate target posts based on cascade pattern
        // This creates the waterfall effect across weeks
        let targetPosts = 0;
        if (weekIndex === 0) {
          // Week 1: Start with 1, build to 4 posts/day
          targetPosts = Math.min(4, Math.ceil((dayIndex + 1) / 2));
        } else if (weekIndex === 1) {
          // Week 2: Start with 0, build to 3 posts/day
          targetPosts = Math.max(0, Math.min(3, Math.ceil((dayIndex - 1) / 2)));
        } else if (weekIndex === 2) {
          // Week 3: Start with 0, build to 2 posts/day
          targetPosts = Math.max(0, Math.min(2, Math.ceil((dayIndex - 3) / 3)));
        } else if (weekIndex === 3) {
          // Week 4: Start with 0, build to 1 post/day
          targetPosts = dayIndex >= 4 ? 1 : 0;
        }
        
        weekDays.push({
          date: dateStr,
          dateObj: date,
          currentPosts,
          targetPosts,
          needsPosts: Math.max(0, targetPosts - currentPosts)
        });
      }
      
      const week = {
        weekNumber: weekIndex + 1,
        startDate: weekStart,
        days: weekDays,
        totalCurrent: weekDays.reduce((sum, day) => sum + day.currentPosts, 0),
        totalTarget: weekDays.reduce((sum, day) => sum + day.targetPosts, 0),
        totalNeeded: weekDays.reduce((sum, day) => sum + day.needsPosts, 0)
      };
      
      weekAnalysis.push(week);
    }
    
    console.log(`🌊 CASCADE Week Analysis:`, weekAnalysis.map(w => ({
      week: w.weekNumber,
      current: w.totalCurrent,
      target: w.totalTarget,
      needed: w.totalNeeded,
      dates: `${w.days[0].date} to ${w.days[6].date}`
    })));
    
    // ✅ STEP 2: Find the best day to schedule based on cascade needs
    let optimalDay = null;
    let optimalDayNeed = -1;
    
    // Priority 1: Fill gaps in Week 1 (foundation)
    const week1Gaps = weekAnalysis[0].days.filter(d => d.needsPosts > 0);
    if (week1Gaps.length > 0) {
      optimalDay = week1Gaps[0];
      console.log(`🌊 CASCADE: Filling Week 1 foundation gap on ${optimalDay.date}`);
    }
    
    // Priority 2: Fill subsequent weeks in order
    if (!optimalDay) {
      for (let weekIndex = 1; weekIndex < weeksToAnalyze; weekIndex++) {
        const weekGaps = weekAnalysis[weekIndex].days.filter(d => d.needsPosts > 0);
        if (weekGaps.length > 0) {
          optimalDay = weekGaps[0];
          console.log(`🌊 CASCADE: Filling Week ${weekIndex + 1} gap on ${optimalDay.date}`);
          break;
        }
      }
    }
    
    // Priority 3: If all targets met, add to day with lowest posts
    if (!optimalDay) {
      let lowestPosts = Infinity;
      
      for (const week of weekAnalysis) {
        for (const day of week.days) {
          if (day.currentPosts < lowestPosts) {
            lowestPosts = day.currentPosts;
            optimalDay = day;
          }
        }
      }
      
      console.log(`🌊 CASCADE: All targets met - adding to least busy day ${optimalDay?.date}`);
    }
    
    // Fallback: Schedule tomorrow if nothing found
    if (!optimalDay) {
      optimalDay = {
        date: tomorrow.toISOString().split('T')[0],
        dateObj: tomorrow,
        currentPosts: 0,
        targetPosts: 1,
        needsPosts: 1
      };
    }
    
    console.log(`🌊 CASCADE Final Decision:`, {
      selectedDate: optimalDay.date,
      currentPosts: optimalDay.currentPosts,
      targetPosts: optimalDay.targetPosts,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][optimalDay.dateObj.getDay()]
    });
    
    return this.setOptimalTime(optimalDay.dateObj, optimalDay.currentPosts);
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