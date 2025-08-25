import { NextRequest, NextResponse } from 'next/server';
import { METRICOOL_CONFIG } from '@/lib/metricool/config';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing timezone conversion for Metricool API...');
    
    // Create test times
    const now = new Date();
    const futureTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
    
    // Test the new timezone conversion method (from the fix)
    const localTimeString = futureTime.toLocaleString('sv-SE', { 
      timeZone: METRICOOL_CONFIG.timezone 
    });
    const metricoolFormat = localTimeString.replace(' ', 'T');
    
    // For comparison, show the old hardcoded method
    const oldMethod = new Date(futureTime.getTime() - (4 * 60 * 60 * 1000));
    const oldFormat = oldMethod.toISOString().slice(0, 19);
    
    // Show current timezone offset for America/New_York
    const easternTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const utcTime = new Date().toISOString();
    
    return NextResponse.json({
      success: true,
      message: 'Timezone conversion test results',
      testTime: futureTime.toISOString(),
      timezone: METRICOOL_CONFIG.timezone,
      conversion: {
        newMethod: {
          format: metricoolFormat,
          description: 'Proper timezone conversion (handles EDT/EST automatically)'
        },
        oldMethod: {
          format: oldFormat,
          description: 'Old hardcoded -4 hours (incorrect for EST)'
        }
      },
      currentTime: {
        utc: utcTime,
        eastern: easternTime,
        difference: 'EST is currently -5 hours from UTC (not -4 as hardcoded)'
      },
      fix: {
        issue: 'Hardcoded -4 hours EDT offset caused "Given datetime cannot be in the past" errors',
        solution: 'Dynamic timezone conversion using toLocaleString with America/New_York timezone',
        benefit: 'Automatically handles EDT (-4) and EST (-5) transitions'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Timezone test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Timezone test failed',
      error: error.message
    }, { status: 500 });
  }
}