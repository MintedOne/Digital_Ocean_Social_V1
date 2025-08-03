import { NextRequest, NextResponse } from 'next/server';
import { fetchMetricoolBrands } from '@/lib/metricool/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API: Fetching Metricool brands...');
    
    const brands = await fetchMetricoolBrands();
    
    console.log('✅ API: Successfully fetched brands:', brands.length);
    return NextResponse.json({ 
      success: true,
      brands,
      message: `Found ${brands.length} brand(s)`
    });
    
  } catch (error) {
    console.error('❌ API: Error fetching brands:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        brands: [] // Return empty array as fallback
      },
      { status: 500 }
    );
  }
}