import { NextRequest, NextResponse } from 'next/server';
import { METRICOOL_CONFIG } from '@/lib/metricool/config';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Metricool API connection...');
    
    // Test the simplest API call first - get user info or blogs
    const response = await fetch(`${METRICOOL_CONFIG.baseURL}/v2/blogs`, {
      method: 'GET',
      headers: {
        'X-Mc-Auth': METRICOOL_CONFIG.userToken,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Test response status:', response.status);
    console.log('📊 Test response headers:', Object.fromEntries(response.headers.entries()));

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ Test successful - JSON response received');
      
      return NextResponse.json({
        success: true,
        status: response.status,
        contentType,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        message: 'Metricool API connection successful'
      });
    } else {
      // Not JSON - likely an error page
      const textResponse = await response.text();
      console.log('❌ Test failed - Non-JSON response:', textResponse.substring(0, 300));
      
      return NextResponse.json({
        success: false,
        status: response.status,
        contentType,
        responsePreview: textResponse.substring(0, 300),
        message: 'Metricool API returned non-JSON response'
      });
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to connect to Metricool API'
      },
      { status: 500 }
    );
  }
}