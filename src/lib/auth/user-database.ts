/**
 * User Database Management
 * Simple JSON file-based user storage (will be upgraded to proper database later)
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// User data structure
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  role: 'admin' | 'user';
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
 * @returns The created user or null if user already exists
 */
export async function createUser(
  email: string, 
  displayName: string,
  role: 'admin' | 'user' = 'user'
): Promise<User | null> {
  const db = await readDatabase();
  
  // Check if user already exists
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    console.log(`⚠️ User already exists: ${email}`);
    return null;
  }
  
  // Create new user
  const newUser: User = {
    id: generateUserId(),
    email: email.toLowerCase(),
    displayName,
    createdAt: new Date().toISOString(),
    isActive: true,
    role,
  };
  
  // Add to database
  db.users.push(newUser);
  await writeDatabase(db);
  
  console.log(`✅ Created new user: ${email}`);
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
 * Initializes the database with a default admin user if empty
 */
export async function initializeDatabase(): Promise<void> {
  const db = await readDatabase();
  
  if (db.users.length === 0) {
    // Create default admin user
    await createUser(
      'admin@mintedyachts.com',
      'Admin User',
      'admin'
    );
    console.log('🔧 Initialized database with default admin user');
  }
}