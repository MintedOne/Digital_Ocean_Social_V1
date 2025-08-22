import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/auth/admin-manager';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    
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