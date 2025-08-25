import { NextRequest, NextResponse } from 'next/server';
import { adminGetAllUsers } from '@/lib/auth/admin-manager';

export async function GET(request: NextRequest) {
  try {
    const result = await adminGetAllUsers();
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        result,
        { status: result.message.includes('required') ? 401 : 403 }
      );
    }
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}