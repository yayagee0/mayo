/**
 * Avatar utility functions for Mayo (FamilyNest) app
 * Provides safe avatar URL generation with fallbacks
 */

export interface Profile {
  avatar_url?: string | null;
  email?: string;
  display_name?: string | null;
}

/**
 * Gets avatar URL for a profile, returns null if no avatar is set
 * Components should handle initials fallback themselves
 */
export function getAuthorAvatar(profile: Profile): string | null {
  return profile?.avatar_url || null;
}

/**
 * Gets author name from profile with fallback to email username
 */
export function getAuthorName(profile: Profile): string {
  if (profile?.display_name) {
    return profile.display_name;
  }
  
  if (profile?.email) {
    return profile.email.split('@')[0];
  }
  
  return 'Unknown User';
}

/**
 * Helper function to find profile by email from profiles array
 */
export function findProfileByEmail(profiles: Profile[], email: string): Profile | undefined {
  return profiles.find(p => p.email === email);
}