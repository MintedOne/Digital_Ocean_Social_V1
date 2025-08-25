/**
 * Admin Manager
 * Administrative functions for user management and system administration
 */

import { 
  User, 
  UserStatus, 
  getAllUsers, 
  getUsersByStatus, 
  getUsersByRole, 
  updateUserStatusById, 
  updateUserRole, 
  findUserById,
  isUserAdmin,
  deleteUser,
  updateUserById 
} from './user-database';
import { getCurrentSession } from './session-manager';
import { GmailAPISender } from './gmail-api-sender';
import { getUserDisplayName } from './user-display-utils';
import { generatePasswordResetToken } from './password-manager';

// Admin action results
export interface AdminActionResult {
  success: boolean;
  message: string;
  data?: any;
}

// User statistics interface
export interface UserStatistics {
  total: number;
  pending: number;
  approved: number;
  blocked: number;
  admins: number;
  users: number;
}

/**
 * Checks if current user has admin privileges
 * @returns True if current user is admin, false otherwise
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const currentUser = await getCurrentSession();
    if (!currentUser) {
      return false;
    }
    
    return await isUserAdmin(currentUser.email);
  } catch (error) {
    console.error('Error checking admin privileges:', error);
    return false;
  }
}

/**
 * Requires admin authentication for protected actions
 * @throws Error if user is not admin
 */
export async function requireAdminAuth(): Promise<User> {
  const currentUser = await getCurrentSession();
  
  if (!currentUser) {
    throw new Error('Authentication required');
  }
  
  const isAdmin = await isUserAdmin(currentUser.email);
  if (!isAdmin) {
    throw new Error('Admin privileges required');
  }
  
  return currentUser;
}

/**
 * Gets all users with admin filtering
 * @returns Array of all users (admin only)
 */
export async function adminGetAllUsers(): Promise<AdminActionResult> {
  try {
    await requireAdminAuth();
    
    const users = await getAllUsers();
    
    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve users'
    };
  }
}

/**
 * Gets user statistics
 * @returns User statistics object
 */
export async function getUserStatistics(): Promise<AdminActionResult> {
  try {
    await requireAdminAuth();
    
    const allUsers = await getAllUsers();
    const pendingUsers = await getUsersByStatus('pending');
    const approvedUsers = await getUsersByStatus('approved');
    const blockedUsers = await getUsersByStatus('blocked');
    const adminUsers = await getUsersByRole('admin');
    const regularUsers = await getUsersByRole('user');
    
    const stats: UserStatistics = {
      total: allUsers.length,
      pending: pendingUsers.length,
      approved: approvedUsers.length,
      blocked: blockedUsers.length,
      admins: adminUsers.length,
      users: regularUsers.length
    };
    
    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve statistics'
    };
  }
}

/**
 * Approves a pending user
 * @param userId - User ID to approve
 * @returns Admin action result
 */
export async function approveUser(userId: string): Promise<AdminActionResult> {
  try {
    const adminUser = await requireAdminAuth();
    
    const user = await findUserById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    if (user.status === 'approved') {
      return {
        success: false,
        message: 'User is already approved'
      };
    }
    
    const updated = await updateUserStatusById(userId, 'approved');
    
    if (updated) {
      console.log(`👍 Admin ${adminUser.email} approved user ${user.email}`);
      
      // Generate password setup token and send email for regular users
      if (user.role !== 'admin') {
        try {
          const setupToken = generatePasswordResetToken();
          
          // Save token to user record
          await updateUserById(userId, {
            passwordResetToken: setupToken,
            passwordResetExpires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          });
          
          // Send approval email with password setup link
          const emailSender = new GmailAPISender();
          if (emailSender.isConfigured()) {
            await emailSender.sendUserApprovalEmail(
              user.email,
              getUserDisplayName(user),
              setupToken
            );
            console.log(`📧 Approval email with password setup sent to: ${user.email}`);
          } else {
            console.log(`⚠️ Email service not configured. User ${user.email} needs to be notified manually about approval.`);
            console.log(`ℹ️ Password setup token: ${setupToken}`);
          }
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
          // Continue even if email fails - user is still approved
        }
      }
      
      return {
        success: true,
        message: `User ${user.email} has been approved${user.role !== 'admin' ? ' and notified via email' : ''}`,
        data: { userId, newStatus: 'approved' }
      };
    } else {
      return {
        success: false,
        message: 'Failed to update user status'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to approve user'
    };
  }
}

/**
 * Blocks a user
 * @param userId - User ID to block
 * @returns Admin action result
 */
export async function blockUser(userId: string): Promise<AdminActionResult> {
  try {
    const adminUser = await requireAdminAuth();
    
    const user = await findUserById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Prevent admin from blocking themselves
    if (user.id === adminUser.id) {
      return {
        success: false,
        message: 'Cannot block yourself'
      };
    }
    
    // Prevent blocking other admins (safety measure)
    if (user.role === 'admin') {
      return {
        success: false,
        message: 'Cannot block admin users'
      };
    }
    
    if (user.status === 'blocked') {
      return {
        success: false,
        message: 'User is already blocked'
      };
    }
    
    const updated = await updateUserStatusById(userId, 'blocked');
    
    if (updated) {
      console.log(`🚫 Admin ${adminUser.email} blocked user ${user.email}`);
      return {
        success: true,
        message: `User ${user.email} has been blocked`,
        data: { userId, newStatus: 'blocked' }
      };
    } else {
      return {
        success: false,
        message: 'Failed to update user status'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to block user'
    };
  }
}

/**
 * Promotes a user to admin
 * @param userId - User ID to promote
 * @returns Admin action result
 */
export async function promoteToAdmin(userId: string): Promise<AdminActionResult> {
  try {
    const adminUser = await requireAdminAuth();
    
    const user = await findUserById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    if (user.role === 'admin') {
      return {
        success: false,
        message: 'User is already an admin'
      };
    }
    
    if (user.status !== 'approved') {
      return {
        success: false,
        message: 'User must be approved before promotion to admin'
      };
    }
    
    const updated = await updateUserRole(userId, 'admin');
    
    if (updated) {
      console.log(`⬆️ Admin ${adminUser.email} promoted user ${user.email} to admin`);
      return {
        success: true,
        message: `User ${user.email} has been promoted to admin`,
        data: { userId, newRole: 'admin' }
      };
    } else {
      return {
        success: false,
        message: 'Failed to update user role'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to promote user'
    };
  }
}

/**
 * Demotes an admin to regular user
 * @param userId - User ID to demote
 * @returns Admin action result
 */
export async function demoteFromAdmin(userId: string): Promise<AdminActionResult> {
  try {
    const adminUser = await requireAdminAuth();
    
    const user = await findUserById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Prevent admin from demoting themselves
    if (user.id === adminUser.id) {
      return {
        success: false,
        message: 'Cannot demote yourself'
      };
    }
    
    if (user.role === 'user') {
      return {
        success: false,
        message: 'User is already a regular user'
      };
    }
    
    const updated = await updateUserRole(userId, 'user');
    
    if (updated) {
      console.log(`⬇️ Admin ${adminUser.email} demoted admin ${user.email} to user`);
      return {
        success: true,
        message: `Admin ${user.email} has been demoted to regular user`,
        data: { userId, newRole: 'user' }
      };
    } else {
      return {
        success: false,
        message: 'Failed to update user role'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to demote user'
    };
  }
}

/**
 * Gets users filtered by status (admin only)
 * @param status - Status to filter by
 * @returns Admin action result with filtered users
 */
export async function adminGetUsersByStatus(status: UserStatus): Promise<AdminActionResult> {
  try {
    await requireAdminAuth();
    
    const users = await getUsersByStatus(status);
    
    return {
      success: true,
      message: `${status} users retrieved successfully`,
      data: users
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve users'
    };
  }
}

/**
 * Deletes a blocked user permanently (admin only)
 * @param userId - User ID to delete
 * @returns Admin action result
 */
export async function deleteBlockedUser(userId: string): Promise<AdminActionResult> {
  try {
    const adminUser = await requireAdminAuth();
    
    const user = await findUserById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Prevent deletion of ts@mintedyachts.com (original admin)
    if (user.email === 'ts@mintedyachts.com') {
      return {
        success: false,
        message: 'Cannot delete the original admin user'
      };
    }
    
    // Only allow deletion of blocked users
    if (user.status !== 'blocked') {
      return {
        success: false,
        message: 'Only blocked users can be deleted'
      };
    }
    
    // Prevent admin from deleting themselves
    if (user.id === adminUser.id) {
      return {
        success: false,
        message: 'Cannot delete yourself'
      };
    }
    
    const deleted = await deleteUser(userId);
    
    if (deleted) {
      console.log(`🗑️ Admin ${adminUser.email} permanently deleted blocked user ${user.email}`);
      return {
        success: true,
        message: `User ${user.email} has been permanently deleted`,
        data: { userId, deletedEmail: user.email }
      };
    } else {
      return {
        success: false,
        message: 'Failed to delete user'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete user'
    };
  }
}