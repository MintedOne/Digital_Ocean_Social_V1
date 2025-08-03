import { NextRequest, NextResponse } from 'next/server';
import { METRICOOL_CONFIG } from '@/lib/metricool/config';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing multiple Metricool API endpoint formats...');
    
    const results = {
      timestamp: new Date().toISOString(),
      config: {
        userToken: METRICOOL_CONFIG.userToken,
        userId: METRICOOL_CONFIG.userId,
        blogId: METRICOOL_CONFIG.blogId,
        baseURL: METRICOOL_CONFIG.baseURL
      },
      tests: {} as any
    };
    
    const testEndpoints = [
      // Correct endpoints from your Metricool account
      `${METRICOOL_CONFIG.baseURL}/v2/settings/brands?userToken=${METRICOOL_CONFIG.userToken}&userId=${METRICOOL_CONFIG.userId}`,
      
      // Test scheduler endpoint (GET should return method not allowed but confirm it exists)
      `${METRICOOL_CONFIG.baseURL}/v2/scheduler/posts?userToken=${METRICOOL_CONFIG.userToken}&userId=${METRICOOL_CONFIG.userId}&blogId=${METRICOOL_CONFIG.blogId}`
    ];
    
    for (let i = 0; i < testEndpoints.length; i++) {
      const url = testEndpoints[i];
      const testName = `test${i + 1}`;
      
      try {
        console.log(`🧪 Testing endpoint ${i + 1}: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-Mc-Auth': METRICOOL_CONFIG.userToken,
            'Content-Type': 'application/json'
          }
        });
        
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          results.tests[testName] = {
            success: true,
            status: response.status,
            url: url,
            contentType,
            hasData: !!data,
            dataKeys: data ? Object.keys(data) : [],
            data: data
          };
          console.log(`✅ Test ${i + 1} successful - JSON response received`);
        } else {
          const textResponse = await response.text();
          results.tests[testName] = {
            success: false,
            status: response.status,
            url: url,
            contentType,
            responsePreview: textResponse.substring(0, 200)
          };
          console.log(`❌ Test ${i + 1} failed - Status: ${response.status}`);
        }
        
      } catch (error) {
        results.tests[testName] = {
          success: false,
          url: url,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        console.error(`❌ Test ${i + 1} error:`, error);
      }
    }
    
    // Find any successful tests
    const successfulTests = Object.values(results.tests).filter((test: any) => test.success);
    results.success = successfulTests.length > 0;
    results.summary = {
      totalTests: testEndpoints.length,
      successfulTests: successfulTests.length,
      workingEndpoints: successfulTests.map((test: any) => test.url),
      recommendedAction: results.success ? 'Use working endpoints found' : 'All endpoints failed - check API documentation'
    };
    
    console.log('🧪 Metricool API test complete:', results);
    
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to test Metricool API connection'
      },
      { status: 500 }
    );
  }
}