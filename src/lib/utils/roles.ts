/**
 * Client-side role utilities for Mayo (FamilyNest) app
 * This mirrors the server-side logic from allowlist.ts
 */

export const ALLOWED_EMAILS = [
	'nilezat@gmail.com',
	'abdessamia.mariem@gmail.com', 
	'yazidgeemail@gmail.com',
	'yahyageemail@gmail.com'
] as const;

export type AllowedEmail = typeof ALLOWED_EMAILS[number];

/**
 * Get user role based on email (client-side version)
 * This mirrors the server-side logic for UI display
 */
export function getUserRole(email: string | null | undefined): 'parent' | 'child' | 'member' {
	if (!email) return 'member';
	
	// Simple role mapping - mirrors server logic
	if (email === 'nilezat@gmail.com' || email === 'yazidgeemail@gmail.com') {
		return 'parent';
	}
	if (email === 'yahyageemail@gmail.com') {
		return 'child';
	}
	return 'member';
}

/**
 * Check if an email is in the allowlist (client-side)
 */
export function isEmailAllowed(email: string | null | undefined): email is AllowedEmail {
	if (!email) return false;
	return ALLOWED_EMAILS.includes(email as AllowedEmail);
}