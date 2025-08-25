import { NextRequest, NextResponse } from 'next/server';
import { METRICOOL_CONFIG } from '@/lib/metricool/config';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing timezone conversion for Metricool API...');
    
    // Create test times
    const now = new Date();
    const futureTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
    
    // Test the CURRENT Metricool API quirk fix (adding 4 hours)
    const offsetTime = new Date(futureTime.getTime() + (4 * 60 * 60 * 1000));
    const metricoolFormat = offsetTime.toISOString().slice(0, 19);
    
    // For comparison, show what proper timezone conversion would be
    const properLocalTimeString = futureTime.toLocaleString('sv-SE', { 
      timeZone: METRICOOL_CONFIG.timezone 
    });
    const properFormat = properLocalTimeString.replace(' ', 'T');
    
    // Show current timezone offset for America/New_York
    const easternTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const utcTime = new Date().toISOString();
    
    return NextResponse.json({
      success: true,
      message: 'Timezone conversion test results',
      testTime: futureTime.toISOString(),
      timezone: METRICOOL_CONFIG.timezone,
      conversion: {
        currentFix: {
          format: metricoolFormat,
          description: 'Metricool API quirk fix (+4 hours to compensate for their broken timezone logic)'
        },
        properMethod: {
          format: properFormat,
          description: 'What proper timezone conversion would be (but Metricool rejects this)'
        }
      },
      currentTime: {
        utc: utcTime,
        eastern: easternTime,
        difference: 'EDT is currently -4 hours from UTC'
      },
      fix: {
        issue: 'Metricool API timezone logic is broken - treats dateTime as UTC despite timezone param',
        solution: 'Add +4 hours to make time look correct in their system (compensates for their UTC assumption)',
        benefit: 'Metricool gets the right local time even though their API logic is backwards'
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