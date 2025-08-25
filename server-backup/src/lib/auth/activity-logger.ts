/**
 * Activity Logger
 * Tracks user login attempts and authentication activity for security monitoring
 */

import { promises as fs } from 'fs';
import { join } from 'path';

const ACTIVITY_LOG_PATH = join(process.cwd(), 'data', 'activity-log.json');

export interface LoginActivity {
  id: string;
  userEmail: string;
  userName?: string;
  userId?: string;
  type: 'login_success' | 'login_failed' | 'logout' | 'password_reset' | 'profile_update' | 'chat_started' | 'video_generation' | 'video_processing' | 'youtube_upload' | 'admin_portal_access';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export interface ActivityLog {
  activities: LoginActivity[];
  metadata: {
    version: string;
    createdAt: string;
    lastModified: string;
  };
}

/**
 * Initialize activity log file if it doesn't exist
 */
export async function initializeActivityLog(): Promise<void> {
  try {
    await fs.access(ACTIVITY_LOG_PATH);
  } catch (error) {
    // File doesn't exist, create it
    const initialLog: ActivityLog = {
      activities: [],
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
    
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    
    await fs.writeFile(ACTIVITY_LOG_PATH, JSON.stringify(initialLog, null, 2));
    console.log('📊 Activity log file created');
  }
}

/**
 * Read activity log from file
 */
async function readActivityLog(): Promise<ActivityLog> {
  try {
    const data = await fs.readFile(ACTIVITY_LOG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading activity log:', error);
    // Return empty log if file is corrupted
    return {
      activities: [],
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
  }
}

/**
 * Write activity log to file
 */
async function writeActivityLog(log: ActivityLog): Promise<void> {
  try {
    log.metadata.lastModified = new Date().toISOString();
    await fs.writeFile(ACTIVITY_LOG_PATH, JSON.stringify(log, null, 2));
  } catch (error) {
    console.error('Error writing activity log:', error);
    throw error;
  }
}

/**
 * Generate unique ID for activity entry
 */
function generateActivityId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Log a user activity
 */
export async function logActivity(
  userEmail: string,
  type: LoginActivity['type'],
  options: {
    userName?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: string;
  } = {}
): Promise<void> {
  try {
    await initializeActivityLog();
    
    const log = await readActivityLog();
    
    const activity: LoginActivity = {
      id: generateActivityId(),
      userEmail,
      userName: options.userName,
      userId: options.userId,
      type,
      timestamp: new Date().toISOString(),
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: options.details
    };
    
    // Add to beginning of array (most recent first)
    log.activities.unshift(activity);
    
    // Keep only last 100 activities to prevent file from growing too large
    if (log.activities.length > 100) {
      log.activities = log.activities.slice(0, 100);
    }
    
    await writeActivityLog(log);
    
    console.log(`📊 Activity logged: ${type} for ${userEmail}`);
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - activity logging should not break authentication
  }
}

/**
 * Get recent activities (for admin dashboard)
 */
export async function getRecentActivities(limit: number = 50): Promise<LoginActivity[]> {
  try {
    await initializeActivityLog();
    const log = await readActivityLog();
    return log.activities.slice(0, limit);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
}

/**
 * Get activities for a specific user
 */
export async function getUserActivities(userEmail: string, limit: number = 20): Promise<LoginActivity[]> {
  try {
    await initializeActivityLog();
    const log = await readActivityLog();
    return log.activities
      .filter(activity => activity.userEmail === userEmail)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting user activities:', error);
    return [];
  }
}

/**
 * Clean up old activities (older than specified days)
 */
export async function cleanupOldActivities(daysToKeep: number = 90): Promise<number> {
  try {
    await initializeActivityLog();
    const log = await readActivityLog();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const originalCount = log.activities.length;
    log.activities = log.activities.filter(
      activity => new Date(activity.timestamp) > cutoffDate
    );
    
    const removedCount = originalCount - log.activities.length;
    
    if (removedCount > 0) {
      await writeActivityLog(log);
      console.log(`📊 Cleaned up ${removedCount} old activity entries`);
    }
    
    return removedCount;
  } catch (error) {
    console.error('Error cleaning up old activities:', error);
    return 0;
  }
}

/**
 * Get activity statistics for dashboard
 */
export async function getActivityStatistics(): Promise<{
  totalActivities: number;
  todayLogins: number;
  failedLoginsToday: number;
  uniqueUsersToday: number;
}> {
  try {
    await initializeActivityLog();
    const log = await readActivityLog();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActivities = log.activities.filter(
      activity => new Date(activity.timestamp) >= today
    );
    
    const todayLogins = todayActivities.filter(
      activity => activity.type === 'login_success'
    ).length;
    
    const failedLoginsToday = todayActivities.filter(
      activity => activity.type === 'login_failed'
    ).length;
    
    const uniqueUsersToday = new Set(
      todayActivities
        .filter(activity => activity.type === 'login_success')
        .map(activity => activity.userEmail)
    ).size;
    
    return {
      totalActivities: log.activities.length,
      todayLogins,
      failedLoginsToday,
      uniqueUsersToday
    };
  } catch (error) {
    console.error('Error getting activity statistics:', error);
    return {
      totalActivities: 0,
      todayLogins: 0,
      failedLoginsToday: 0,
      uniqueUsersToday: 0
    };
  }
}