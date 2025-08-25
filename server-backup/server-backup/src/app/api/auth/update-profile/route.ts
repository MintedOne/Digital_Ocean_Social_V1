import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session-manager';
import { updateUserProfile, UserAddress } from '@/lib/auth/user-database';
import { logActivity } from '@/lib/auth/activity-logger';
import { getUserDisplayName } from '@/lib/auth/user-display-utils';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getCurrentSession();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const {
      firstName,
      lastName,
      phoneNumber,
      address
    } = await request.json();
    
    // Validate input data
    const profileData: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      address?: UserAddress;
    } = {};
    
    // Only include provided fields
    if (firstName !== undefined) {
      profileData.firstName = firstName?.trim() || '';
    }
    
    if (lastName !== undefined) {
      profileData.lastName = lastName?.trim() || '';
    }
    
    if (phoneNumber !== undefined) {
      profileData.phoneNumber = phoneNumber?.trim() || '';
    }
    
    if (address !== undefined) {
      profileData.address = {
        streetAddress: address.streetAddress?.trim() || '',
        city: address.city?.trim() || '',
        stateProvince: address.stateProvince?.trim() || '',
        zipPostalCode: address.zipPostalCode?.trim() || '',
        country: address.country?.trim() || ''
      };
    }
    
    // Update user profile
    const updatedUser = await updateUserProfile(user.id, profileData);
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }
    
    // Log the profile update activity
    try {
      await logActivity(
        updatedUser.email,
        'profile_update',
        {
          userName: getUserDisplayName(updatedUser),
          userId: updatedUser.id,
          ipAddress: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          details: 'Profile information updated'
        }
      );
    } catch (logError) {
      console.error('Failed to log profile update activity:', logError);
      // Continue even if logging fails
    }
    
    // Return success response with updated profile data
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        address: updatedUser.address,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Profile update failed' 
      },
      { status: 500 }
    );
  }
}