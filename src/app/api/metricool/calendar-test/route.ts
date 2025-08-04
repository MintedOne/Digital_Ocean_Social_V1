import { NextRequest, NextResponse } from 'next/server';
import { metricoolCalendar } from '@/lib/metricool/calendar-reader';

/**
 * Test endpoint for Metricool Calendar API
 * Tests connection and calendar reading functionality
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Metricool Calendar API...');
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    // Test 1: Basic connection
    console.log('📋 Test 1: Basic API connection');
    try {
      const connectionResult = await metricoolCalendar.testConnection();
      results.tests.connection = {
        success: true,
        message: 'API connection successful',
        data: connectionResult
      };
    } catch (error) {
      results.tests.connection = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 2: Get scheduled posts (7 days)
    console.log('📋 Test 2: Fetching scheduled posts (7 days)');
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];
      
      const posts = await metricoolCalendar.getScheduledPosts(today, nextWeek);
      results.tests.scheduledPosts = {
        success: true,
        postsFound: posts.length,
        dateRange: { start: today, end: nextWeek },
        samplePost: posts.length > 0 ? posts[0] : null
      };
    } catch (error) {
      results.tests.scheduledPosts = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 3: Calendar analysis (4 weeks)
    console.log('📋 Test 3: Calendar analysis (4 weeks)');
    try {
      const analysis = await metricoolCalendar.analyzeCalendarForPlanning(28);
      results.tests.calendarAnalysis = {
        success: true,
        totalScheduled: analysis.totalScheduled,
        recommendations: analysis.recommendations,
        platformBreakdown: analysis.platformBreakdown,
        dailyBreakdown: analysis.dailyBreakdown
      };
    } catch (error) {
      results.tests.calendarAnalysis = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 4: Calendar display data
    console.log('📋 Test 4: Calendar display data');
    try {
      const displayData = await metricoolCalendar.getCalendarDisplayData();
      results.tests.displayData = {
        success: true,
        postsCount: displayData.posts.length,
        totalScheduled: displayData.analysis.totalScheduled,
        optimalTime: displayData.optimalTime,
        recommendationsCount: displayData.analysis.recommendations.length
      };
    } catch (error) {
      results.tests.displayData = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Overall success
    const allTestsPassed = Object.values(results.tests).every((test: any) => test.success);
    results.overallSuccess = allTestsPassed;
    
    console.log('🧪 Calendar API test results:', {
      success: results.overallSuccess,
      testsRun: Object.keys(results.tests).length
    });
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ Calendar API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Calendar API test failed'
    }, { status: 500 });
  }
}