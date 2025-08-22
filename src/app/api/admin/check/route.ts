import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/auth/admin-manager';
import { getCurrentSession } from '@/lib/auth/session-manager';
import { logActivity } from '@/lib/auth/activity-logger';
import { getUserDisplayName } from '@/lib/auth/user-display-utils';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    
    // Track admin portal access for authenticated users
    if (isAdmin) {
      try {
        const user = await getCurrentSession();
        if (user) {
          const ipAddress = request.headers.get('x-forwarded-for') || 
                           request.headers.get('x-real-ip') || 
                           'unknown';
          const userAgent = request.headers.get('user-agent') || 'unknown';
          
          await logActivity(
            user.email,
            'admin_portal_access',
            {
              userName: getUserDisplayName(user),
              userId: user.id,
              ipAddress,
              userAgent,
              details: 'Accessed admin portal dashboard'
            }
          );
        }
      } catch (logError) {
        console.error('Failed to log admin portal access:', logError);
        // Continue even if logging fails
      }
    }
    
    return NextResponse.json({
      success: true,
      isAdmin,
      message: isAdmin ? 'User has admin privileges' : 'User does not have admin privileges'
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        isAdmin: false,
        error: 'Failed to check admin privileges' 
      },
      { status: 500 }
    );
  }
}