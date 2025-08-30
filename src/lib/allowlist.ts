// Allowed emails for the family application
const ALLOWED_EMAILS = [
  'nilezat@gmail.com',
  'abdessamia.mariem@gmail.com', 
  'yazidgeemail@gmail.com',
  'yahyageemail@gmail.com'
];

// Family ID constant
export const FAMILY_ID = import.meta.env.VITE_FAMILY_ID || 'ghassan-family';

// Check if an email is in the allowlist
export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}

// Get all allowed emails
export function getAllowedEmails(): string[] {
  return [...ALLOWED_EMAILS];
}

// Validate user access
export function validateUserAccess(user: { email?: string | null }): boolean {
  if (!user || !user.email) {
    return false;
  }
  return isEmailAllowed(user.email);
}