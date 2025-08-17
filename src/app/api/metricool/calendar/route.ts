import { NextRequest, NextResponse } from 'next/server';
import { metricoolCalendar } from '@/lib/metricool/calendar-reader';

/**
 * GET: Fetch calendar data for 4-week display
 * READ ONLY - Does not modify posting workflow
 * Supports forced refresh with ?force=true parameter
 */
export async function GET(request: NextRequest) {
  try {
    // Check for force refresh parameter
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('force') === 'true';
    const refreshIndicator = forceRefresh ? ' (FORCE REFRESH)' : '';
    
    console.log(`📅 API: Fetching calendar display data${refreshIndicator}...`);
    
    // Test connection first
    try {
      await metricoolCalendar.testConnection();
      console.log('✅ Calendar API connection verified');
    } catch (connectionError) {
      console.log('⚠️ Calendar API connection failed, returning empty data');
      
      const today = new Date();
      const endDate = new Date(today.getTime() + (28 * 24 * 60 * 60 * 1000));
      
      return NextResponse.json({
        success: true,
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
          recommendations: ['📅 Calendar API unavailable - using conservative scheduling']
        },
        optimalTime: new Date(Date.now() + 24*60*60*1000).toISOString(),
        source: 'Fallback data'
      });
    }
    
    // Get calendar display data with optional force refresh
    const calendarData = await metricoolCalendar.getCalendarDisplayData(forceRefresh);
    
    console.log(`📊 Calendar data prepared: ${calendarData.posts.length} posts, ${calendarData.analysis.recommendations.length} recommendations`);
    
    const response = NextResponse.json({
      success: true,
      ...calendarData,
      source: 'Metricool API'
    });
    
    // Add aggressive cache-busting headers for force refresh
    if (forceRefresh) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Last-Modified', new Date().toUTCString());
      console.log('🚫 Cache-busting headers added for frontend refresh');
    }
    
    return response;
    
  } catch (error) {
    console.error('❌ Calendar API error:', error);
    
    // Return safe fallback - don't break the workflow
    const today = new Date();
    const endDate = new Date(today.getTime() + (28 * 24 * 60 * 60 * 1000));
    
    return NextResponse.json({
      success: false,
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
        recommendations: ['📅 Calendar error - using conservative scheduling']
      },
      optimalTime: new Date(Date.now() + 24*60*60*1000).toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'Error fallback'
    });
  }
}