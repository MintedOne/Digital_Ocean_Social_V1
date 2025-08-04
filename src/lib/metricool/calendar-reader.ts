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
   * Following Claude Desktop guide pattern
   */
  async getScheduledPosts(startDate: string, endDate: string): Promise<ScheduledPost[]> {
    try {
      console.log(`📅 Fetching scheduled posts from ${startDate} to ${endDate}`);
      
      // Try multiple endpoint variations as suggested in guide
      const endpoints = [
        // Primary calendar endpoint from guide
        `${this.baseURL}/calendar/posts`,
        // Alternative endpoints to try
        `${this.baseURL}/v2/scheduler/posts`,
        `${this.baseURL}/scheduler/posts`
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);
          
          const url = new URL(endpoint);
          url.searchParams.append('userId', this.config.userId.toString());
          url.searchParams.append('blogId', this.config.blogId.toString());
          url.searchParams.append('startDate', startDate);
          url.searchParams.append('endDate', endDate);

          const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.headers
          });

          if (response.ok) {
            const data = await response.json();
            const posts = data.data || data || [];
            
            if (Array.isArray(posts) && posts.length > 0) {
              console.log(`✅ Retrieved ${posts.length} scheduled posts from ${endpoint}`);
              return posts;
            } else {
              console.log(`⚠️ Endpoint ${endpoint} returned empty data`);
            }
          } else {
            console.log(`❌ Endpoint ${endpoint} failed: ${response.status}`);
          }
        } catch (endpointError) {
          console.log(`❌ Endpoint ${endpoint} error:`, endpointError);
        }
      }

      // All endpoints failed - return empty array to avoid breaking workflow
      console.log('📊 No scheduled posts found via any endpoint');
      return [];
      
    } catch (error) {
      console.error('❌ Failed to get scheduled posts:', error);
      
      // Don't throw - return empty array to allow workflow to continue
      return [];
    }
  }

  /**
   * Smart calendar analysis for planning - following guide pattern
   */
  async analyzeCalendarForPlanning(daysAhead: number = 28): Promise<CalendarAnalysis> {
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
    
    // Generate smart recommendations following guide pattern
    if (analysis.totalScheduled === 0) {
      analysis.recommendations.push('📈 Calendar is clear - optimal time to schedule posts');
    } else {
      analysis.recommendations.push(`📊 Found ${analysis.totalScheduled} existing posts in next ${daysAhead} days`);
      
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
    
    return analysis;
  }

  /**
   * Calculate optimal posting time based on calendar data - following guide pattern
   */
  calculateOptimalTime(analysis: CalendarAnalysis): string {
    const now = new Date();
    
    // Find least busy day in next 7 days
    const nextSevenDays = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      const postsOnDate = analysis.dailyBreakdown[dateStr] || 0;
      nextSevenDays.push({ date: dateStr, posts: postsOnDate, dateObj: date });
    }
    
    // Sort by least busy
    nextSevenDays.sort((a, b) => a.posts - b.posts);
    
    // Use least busy day at optimal time (2 PM EST as per guide)
    const optimalDate = nextSevenDays[0].dateObj;
    optimalDate.setHours(14, 0, 0, 0); // 2:00 PM
    
    console.log(`⏰ Calculated optimal time: ${optimalDate.toLocaleString()} (${nextSevenDays[0].posts} existing posts on that day)`);
    
    return optimalDate.toISOString();
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
      
      const analysis = await this.analyzeCalendarForPlanning(28); // 4 weeks
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
        optimalTime: new Date(Date.now() + 24*60*60*1000).toISOString() // Tomorrow
      };
    }
  }
}

// Export singleton instance
export const metricoolCalendar = new MetricoolCalendarReader();