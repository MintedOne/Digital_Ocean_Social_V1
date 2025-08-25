/**
 * Password Manager
 * Handles yearly admin passwords and user password management
 */

import bcrypt from 'bcryptjs';
import { User, findUserByEmail, updateUserById } from './user-database';

const SALT_ROUNDS = 10;
const ADMIN_PASSWORD_PREFIX = 'SocialPosts';

/**
 * Gets the current admin password based on the current year
 * @returns The admin password for the current year
 */
export function getCurrentAdminPassword(): string {
  const currentYear = new Date().getFullYear();
  return `${ADMIN_PASSWORD_PREFIX}${currentYear}`;
}

/**
 * Verifies if the provided password matches the admin password
 * @param password - Password to verify
 * @returns True if password matches admin password
 */
export function verifyAdminPassword(password: string): boolean {
  const expectedPassword = getCurrentAdminPassword();
  return password === expectedPassword;
}

/**
 * Hashes a password for secure storage
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Sets a user's password
 * @param userId - User ID
 * @param password - Plain text password
 * @returns True if password was set successfully
 */
export async function setUserPassword(userId: string, password: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(password);
    const success = await updateUserById(userId, { passwordHash: hashedPassword });
    
    if (success) {
      console.log(`🔐 Password set for user ${userId}`);
    }
    
    return success;
  } catch (error) {
    console.error('Error setting user password:', error);
    return false;
  }
}

/**
 * Validates user credentials
 * @param email - User email
 * @param password - Plain text password
 * @returns User object if credentials are valid, null otherwise
 */
export async function validateUserCredentials(email: string, password: string): Promise<User | null> {
  try {
    const user = await findUserByEmail(email);
    
    if (!user) {
      return null;
    }
    
    // Check if user is admin
    if (user.role === 'admin') {
      // Admin users use yearly password
      if (verifyAdminPassword(password)) {
        console.log(`✅ Admin ${email} authenticated with yearly password`);
        return user;
      }
    } else if (user.passwordHash) {
      // Regular users use their own password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (isValid) {
        console.log(`✅ User ${email} authenticated with personal password`);
        return user;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error validating credentials:', error);
    return null;
  }
}

/**
 * Checks if a user has a password set
 * @param email - User email
 * @returns True if user has a password
 */
export async function userHasPassword(email: string): Promise<boolean> {
  try {
    const user = await findUserByEmail(email);
    
    if (!user) {
      return false;
    }
    
    // Admin users always have a password (yearly password)
    if (user.role === 'admin') {
      return true;
    }
    
    // Regular users need a passwordHash
    return !!user.passwordHash;
  } catch (error) {
    console.error('Error checking user password:', error);
    return false;
  }
}

/**
 * Generates a random password reset token
 * @returns A random token string
 */
export function generatePasswordResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Gets password requirements message
 * @returns Password requirements string
 */
export function getPasswordRequirements(): string {
  return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.';
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Object with isValid flag and message
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true, message: 'Password meets requirements' };
}