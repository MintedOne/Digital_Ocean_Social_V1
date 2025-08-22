/**
 * User Database Management
 * Simple JSON file-based user storage (will be upgraded to proper database later)
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// User status types
export type UserStatus = 'pending' | 'approved' | 'blocked';

// User data structure
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  role: 'admin' | 'user';
  status: UserStatus;
  passwordHash?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
}

// Database file path - stored in project root data directory
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'users.json');

/**
 * Ensures the database file exists
 */
async function ensureDatabase(): Promise<void> {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(DB_DIR, { recursive: true });
    
    // Check if database file exists
    await fs.access(DB_FILE);
  } catch {
    // Create initial database file with empty array
    const initialData = {
      users: [],
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      }
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
    console.log('📁 Created initial user database');
  }
}

/**
 * Reads the user database
 */
async function readDatabase(): Promise<{ users: User[], metadata: any }> {
  await ensureDatabase();
  const data = await fs.readFile(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

/**
 * Writes to the user database
 */
async function writeDatabase(data: { users: User[], metadata: any }): Promise<void> {
  data.metadata.lastModified = new Date().toISOString();
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

/**
 * Generates a unique user ID
 */
function generateUserId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Creates a new user
 * @param email - User's email address
 * @param displayName - User's display name
 * @param role - User's role (admin or user)
 * @param status - User's initial status (defaults to 'approved' for admins, 'pending' for users)
 * @returns The created user or null if user already exists
 */
export async function createUser(
  email: string, 
  displayName: string,
  role: 'admin' | 'user' = 'user',
  status?: UserStatus
): Promise<User | null> {
  const db = await readDatabase();
  
  // Check if user already exists
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    console.log(`⚠️ User already exists: ${email}`);
    return null;
  }
  
  // Default status based on role
  const userStatus = status || (role === 'admin' ? 'approved' : 'pending');
  
  // Create new user
  const newUser: User = {
    id: generateUserId(),
    email: email.toLowerCase(),
    displayName,
    createdAt: new Date().toISOString(),
    isActive: true,
    role,
    status: userStatus,
  };
  
  // Add to database
  db.users.push(newUser);
  await writeDatabase(db);
  
  console.log(`✅ Created new user: ${email} (${role}, ${userStatus})`);
  return newUser;
}

/**
 * Finds a user by email
 * @param email - User's email address
 * @returns The user or null if not found
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await readDatabase();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Finds a user by ID
 * @param id - User's ID
 * @returns The user or null if not found
 */
export async function findUserById(id: string): Promise<User | null> {
  const db = await readDatabase();
  return db.users.find(u => u.id === id) || null;
}

/**
 * Updates user's last login time
 * @param userId - User's ID
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const db = await readDatabase();
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    db.users[userIndex].lastLogin = new Date().toISOString();
    await writeDatabase(db);
    console.log(`📅 Updated last login for user: ${db.users[userIndex].email}`);
  }
}

/**
 * Gets all users
 * @returns Array of all users
 */
export async function getAllUsers(): Promise<User[]> {
  const db = await readDatabase();
  return db.users;
}

/**
 * Deletes a user
 * @param userId - User's ID
 * @returns True if deleted, false if not found
 */
export async function deleteUser(userId: string): Promise<boolean> {
  const db = await readDatabase();
  const initialLength = db.users.length;
  db.users = db.users.filter(u => u.id !== userId);
  
  if (db.users.length < initialLength) {
    await writeDatabase(db);
    console.log(`🗑️ Deleted user with ID: ${userId}`);
    return true;
  }
  
  return false;
}

/**
 * Updates user status
 * @param userId - User's ID
 * @param isActive - New active status
 */
export async function updateUserStatus(userId: string, isActive: boolean): Promise<void> {
  const db = await readDatabase();
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    db.users[userIndex].isActive = isActive;
    await writeDatabase(db);
    console.log(`🔄 Updated status for user: ${db.users[userIndex].email} to ${isActive ? 'active' : 'inactive'}`);
  }
}

/**
 * Updates user status
 * @param userId - User's ID
 * @param status - New user status
 */
export async function updateUserStatusById(userId: string, status: UserStatus): Promise<boolean> {
  const db = await readDatabase();
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    db.users[userIndex].status = status;
    // If blocking user, also set as inactive
    if (status === 'blocked') {
      db.users[userIndex].isActive = false;
    } else if (status === 'approved') {
      db.users[userIndex].isActive = true;
    }
    await writeDatabase(db);
    console.log(`🔄 Updated status for user: ${db.users[userIndex].email} to ${status}`);
    return true;
  }
  return false;
}

/**
 * Updates user role
 * @param userId - User's ID
 * @param role - New user role
 */
export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<boolean> {
  const db = await readDatabase();
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    db.users[userIndex].role = role;
    await writeDatabase(db);
    console.log(`🔄 Updated role for user: ${db.users[userIndex].email} to ${role}`);
    return true;
  }
  return false;
}

/**
 * Gets users by status
 * @param status - User status to filter by
 * @returns Array of users with the specified status
 */
export async function getUsersByStatus(status: UserStatus): Promise<User[]> {
  const db = await readDatabase();
  return db.users.filter(u => u.status === status);
}

/**
 * Gets users by role
 * @param role - User role to filter by
 * @returns Array of users with the specified role
 */
export async function getUsersByRole(role: 'admin' | 'user'): Promise<User[]> {
  const db = await readDatabase();
  return db.users.filter(u => u.role === role);
}

/**
 * Checks if user is admin by email
 * @param email - User's email address
 * @returns True if user is admin, false otherwise
 */
export async function isUserAdmin(email: string): Promise<boolean> {
  const user = await findUserByEmail(email);
  return user?.role === 'admin' && user?.status === 'approved' && user?.isActive || false;
}

/**
 * Initializes the database with default admin users if empty
 */
export async function initializeDatabase(): Promise<void> {
  const db = await readDatabase();
  
  if (db.users.length === 0) {
    // Create default admin users
    const defaultAdmins = [
      { email: 'admin@mintedyachts.com', name: 'System Admin' },
      { email: 'info@mintedyachts.com', name: 'Info Admin' },
      { email: 'ts@mintedyachts.com', name: 'TS Admin' }
    ];
    
    for (const admin of defaultAdmins) {
      await createUser(admin.email, admin.name, 'admin', 'approved');
    }
    
    console.log('🔧 Initialized database with default admin users');
  }
}