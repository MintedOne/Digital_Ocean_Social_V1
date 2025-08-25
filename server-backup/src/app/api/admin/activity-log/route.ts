import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session-manager';
import { isUserAdmin } from '@/lib/auth/user-database';
import { getRecentActivities, getActivityStatistics } from '@/lib/auth/activity-logger';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getCurrentSession();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has admin privileges
    const isAdmin = await isUserAdmin(user.email);
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const includeStats = searchParams.get('includeStats') === 'true';
    
    // Get recent activities
    const activities = await getRecentActivities(Math.min(limit, 100)); // Cap at 100
    
    // Optionally include statistics
    let statistics = null;
    if (includeStats) {
      statistics = await getActivityStatistics();
    }
    
    return NextResponse.json({
      success: true,
      data: {
        activities,
        statistics,
        total: activities.length
      }
    });
    
  } catch (error) {
    console.error('Activity log API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve activity log' 
      },
      { status: 500 }
    );
  }
}