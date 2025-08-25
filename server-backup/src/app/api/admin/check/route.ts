import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/auth/admin-manager';
import { getCurrentSession, shouldLogAdminPortalAccess, recordAdminPortalAccessLogged } from '@/lib/auth/session-manager';
import { logActivity } from '@/lib/auth/activity-logger';
import { getUserDisplayName } from '@/lib/auth/user-display-utils';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    
    // Track admin portal access for authenticated users (with session-based debouncing)
    if (isAdmin) {
      try {
        const shouldLog = await shouldLogAdminPortalAccess(30); // 30-minute debounce
        
        if (shouldLog) {
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
            
            // Record that logging occurred for this session
            await recordAdminPortalAccessLogged();
            
            console.log(`📊 Admin portal access logged for ${user.email} (debounced)`);
          }
        } else {
          console.log(`🔄 Admin portal access skipped (within 30min debounce period)`);
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