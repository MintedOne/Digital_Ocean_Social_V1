/**
 * User Display Name Utilities
 * Provides consistent name display logic across the entire application
 */

interface UserNameData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
}

/**
 * Gets the display name for a user following consistent priority:
 * 1. firstName + lastName (if both exist)
 * 2. displayName (if exists)
 * 3. email prefix (fallback)
 * 
 * @param user - User object with name fields
 * @returns The formatted display name
 */
export function getUserDisplayName(user: UserNameData | null | undefined): string {
  if (!user) return 'Guest';
  
  // Priority 1: Use firstName + lastName if both exist
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  // Priority 2: Use displayName if exists
  if (user.displayName) {
    return user.displayName;
  }
  
  // Priority 3: Use email prefix as fallback
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    // Capitalize first letter
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }
  
  return 'Guest';
}

/**
 * Gets the first name only for personalized greetings
 * @param user - User object with name fields
 * @returns The first name or appropriate fallback
 */
export function getUserFirstName(user: UserNameData | null | undefined): string {
  if (!user) return 'Guest';
  
  // Use firstName if exists
  if (user.firstName) {
    return user.firstName;
  }
  
  // Fallback to full display name
  return getUserDisplayName(user);
}