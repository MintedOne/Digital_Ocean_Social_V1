import { NextRequest, NextResponse } from 'next/server';
import { 
  approveUser, 
  blockUser, 
  promoteToAdmin, 
  demoteFromAdmin 
} from '@/lib/auth/admin-manager';

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();
    
    if (!userId || !action) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User ID and action are required' 
        },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'approve':
        result = await approveUser(userId);
        break;
      case 'block':
        result = await blockUser(userId);
        break;
      case 'promote':
        result = await promoteToAdmin(userId);
        break;
      case 'demote':
        result = await demoteFromAdmin(userId);
        break;
      default:
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid action' 
          },
          { status: 400 }
        );
    }
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        result,
        { status: result.message.includes('required') ? 401 : 403 }
      );
    }
  } catch (error) {
    console.error('Admin user action API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}