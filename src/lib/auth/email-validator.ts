/**
 * Email Validator for Minted Yachts Authentication
 * Validates email addresses against allowed domains
 */

// Configuration for allowed email domains
export const AUTH_CONFIG = {
  allowedDomains: ['mintedyachts.com'], // Can be expanded in the future
  strictMode: true, // When true, only allows exact domain matches
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedEmail?: string;
}

/**
 * Validates an email address against allowed domains
 * @param email - The email address to validate
 * @returns ValidationResult with validation status and normalized email
 */
export function validateEmail(email: string): ValidationResult {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return {
      isValid: false,
      error: 'Email address is required',
    };
  }
  
  // Normalize email to lowercase and trim whitespace
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!emailRegex.test(normalizedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }
  
  // Extract domain from email
  const domain = normalizedEmail.split('@')[1];
  
  // Check if domain is in allowed list
  const isAllowedDomain = AUTH_CONFIG.allowedDomains.some(
    allowedDomain => domain === allowedDomain.toLowerCase()
  );
  
  if (!isAllowedDomain) {
    return {
      isValid: false,
      error: 'Only Authorized Users Allowed',
    };
  }
  
  return {
    isValid: true,
    normalizedEmail,
  };
}

/**
 * Checks if an email belongs to an allowed domain
 * @param email - The email address to check
 * @returns boolean indicating if the email is from an allowed domain
 */
export function isAllowedEmail(email: string): boolean {
  const result = validateEmail(email);
  return result.isValid;
}

/**
 * Extracts username from a valid email address
 * @param email - The email address
 * @returns The username part before @ or null if invalid
 */
export function extractUsername(email: string): string | null {
  const result = validateEmail(email);
  if (!result.isValid || !result.normalizedEmail) {
    return null;
  }
  return result.normalizedEmail.split('@')[0];
}

/**
 * Generates a display name from email
 * @param email - The email address
 * @returns A formatted display name
 */
export function generateDisplayName(email: string): string {
  const username = extractUsername(email);
  if (!username) {
    return 'Guest';
  }
  
  // Convert username to title case (e.g., john.doe -> John Doe)
  return username
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}