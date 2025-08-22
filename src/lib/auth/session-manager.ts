/**
 * Session Manager
 * Handles cookie-based session management for user authentication
 */

import { cookies } from 'next/headers';
import crypto from 'crypto';
import { User, findUserById, updateLastLogin } from './user-database';

// Extend globalThis for session persistence across Hot Module Reloads
declare global {
  var sessionStore: Map<string, {
    userId: string;
    email: string;
    createdAt: Date;
    expiresAt: Date;
  }> | undefined;
  var adminAccessTracking: Map<string, Date> | undefined;
}

// Session configuration
const SESSION_CONFIG = {
  cookieName: 'minted-yachts-session',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
};

// In-memory session store (will be upgraded to Redis or database later)
// Map of session token to user data
// Use globalThis to persist across Hot Module Reloads during development
const getSessionStore = () => {
  if (!globalThis.sessionStore) {
    globalThis.sessionStore = new Map<string, {
      userId: string;
      email: string;
      createdAt: Date;
      expiresAt: Date;
    }>();
    console.log('🔄 SessionStore: Initialized new session store');
  }
  return globalThis.sessionStore;
};

// Admin access tracking store (prevents duplicate admin portal access logging)
// Map of session token to last admin access timestamp
const getAdminAccessTracking = () => {
  if (!globalThis.adminAccessTracking) {
    globalThis.adminAccessTracking = new Map<string, Date>();
    console.log('🔄 AdminAccessTracking: Initialized admin access tracking store');
  }
  return globalThis.adminAccessTracking;
};

const sessionStore = getSessionStore();
const adminAccessTracking = getAdminAccessTracking();

/**
 * Generates a secure session token
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates a new session for a user
 * @param user - The user to create a session for
 * @returns The session token
 */
export async function createSession(user: User): Promise<string> {
  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_CONFIG.maxAge * 1000);
  
  // Store session in memory
  sessionStore.set(token, {
    userId: user.id,
    email: user.email,
    createdAt: now,
    expiresAt,
  });
  
  // Update user's last login
  await updateLastLogin(user.id);
  
  // Set cookie
  cookies().set(SESSION_CONFIG.cookieName, token, {
    maxAge: SESSION_CONFIG.maxAge,
    secure: SESSION_CONFIG.secure,
    httpOnly: SESSION_CONFIG.httpOnly,
    sameSite: SESSION_CONFIG.sameSite,
    path: SESSION_CONFIG.path,
  });
  
  console.log(`🔐 Created session for user: ${user.email} | Store size: ${sessionStore.size} | Token: ${token.substring(0, 8)}...`);
  return token;
}

/**
 * Gets the current session
 * @returns The current user or null if no valid session
 */
export async function getCurrentSession(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_CONFIG.cookieName)?.value;
    
    if (!token) {
      return null;
    }
    
    // Get session from store
    const session = sessionStore.get(token);
    
    if (!session) {
      console.log(`⚠️ Session not found in store | Token: ${token?.substring(0, 8)}... | Store size: ${sessionStore.size} | Available tokens: ${Array.from(sessionStore.keys()).map(k => k.substring(0, 8)).join(', ')}`);
      return null;
    }
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      console.log('⏰ Session expired');
      sessionStore.delete(token);
      return null;
    }
    
    // Get user from database
    const user = await findUserById(session.userId);
    
    if (!user) {
      console.log('❌ User not found for session');
      sessionStore.delete(token);
      return null;
    }
    
    if (!user.isActive) {
      console.log('🚫 User account is inactive');
      sessionStore.delete(token);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
}

/**
 * Validates a session token
 * @param token - The session token to validate
 * @returns True if valid, false otherwise
 */
export function validateSession(token: string): boolean {
  const session = sessionStore.get(token);
  
  if (!session) {
    return false;
  }
  
  // Check if expired
  if (new Date() > session.expiresAt) {
    sessionStore.delete(token);
    return false;
  }
  
  return true;
}

/**
 * Destroys the current session
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_CONFIG.cookieName)?.value;
    
    if (token) {
      // Remove from session store
      const session = sessionStore.get(token);
      if (session) {
        console.log(`🔓 Destroying session for user: ${session.email}`);
        sessionStore.delete(token);
      }
      
      // Clean up admin access tracking for this session
      adminAccessTracking.delete(token);
      
      // Remove cookie by setting it with maxAge 0
      cookieStore.set(SESSION_CONFIG.cookieName, '', {
        maxAge: 0,
        path: SESSION_CONFIG.path,
      });
    }
  } catch (error) {
    console.error('Error destroying session:', error);
  }
}

/**
 * Cleans up expired sessions
 * Should be called periodically
 */
export function cleanupExpiredSessions(): void {
  const now = new Date();
  let cleanedCount = 0;
  let cleanedAccessCount = 0;
  
  // Clean up expired sessions
  for (const [token, session] of sessionStore.entries()) {
    if (now > session.expiresAt) {
      sessionStore.delete(token);
      cleanedCount++;
      
      // Also clean up admin access tracking for expired sessions
      if (adminAccessTracking.has(token)) {
        adminAccessTracking.delete(token);
        cleanedAccessCount++;
      }
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired sessions and ${cleanedAccessCount} admin access tracking entries`);
  }
}

/**
 * Gets all active sessions (for admin purposes)
 * @returns Array of active session info
 */
export function getActiveSessions(): Array<{
  email: string;
  createdAt: Date;
  expiresAt: Date;
}> {
  const now = new Date();
  const activeSessions = [];
  
  for (const session of sessionStore.values()) {
    if (now <= session.expiresAt) {
      activeSessions.push({
        email: session.email,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      });
    }
  }
  
  return activeSessions;
}

/**
 * Checks if a user is logged in
 * @returns True if user has valid session, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentSession();
  return user !== null;
}

/**
 * Checks if admin portal access should be logged for current session
 * Implements session-based debouncing to prevent duplicate logging
 * @param debounceMinutes - Minutes to wait before allowing another log entry (default: 30)
 * @returns True if should log, false if already logged recently
 */
export async function shouldLogAdminPortalAccess(debounceMinutes: number = 30): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_CONFIG.cookieName)?.value;
    
    if (!token) {
      return false; // No session
    }
    
    const now = new Date();
    const lastAccess = adminAccessTracking.get(token);
    
    // If never logged or debounce period expired, allow logging
    if (!lastAccess) {
      return true;
    }
    
    // Check if debounce period has passed
    const debounceMs = debounceMinutes * 60 * 1000;
    const timeSinceLastAccess = now.getTime() - lastAccess.getTime();
    
    return timeSinceLastAccess >= debounceMs;
  } catch (error) {
    console.error('Error checking admin portal access logging:', error);
    return false;
  }
}

/**
 * Records that admin portal access was logged for current session
 * Used to prevent duplicate logging within debounce period
 */
export async function recordAdminPortalAccessLogged(): Promise<void> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_CONFIG.cookieName)?.value;
    
    if (!token) {
      return; // No session
    }
    
    adminAccessTracking.set(token, new Date());
    console.log(`📊 Recorded admin portal access logged for session: ${token.substring(0, 8)}...`);
  } catch (error) {
    console.error('Error recording admin portal access log:', error);
  }
}

// Clean up expired sessions every hour
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
}