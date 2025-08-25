/**
 * Local avatar bank for Mayo (FamilyNest) app
 * Provides fallback avatars when users don't upload their own
 */

export const avatarBank = [
  "/avatars/avatar-1.svg",
  "/avatars/avatar-2.svg", 
  "/avatars/avatar-3.svg",
  "/avatars/avatar-4.svg",
  "/avatars/avatar-5.svg",
  "/avatars/avatar-6.svg",
];

/**
 * Get a random avatar from the bank
 */
export function getRandomAvatar(): string {
  return avatarBank[Math.floor(Math.random() * avatarBank.length)];
}

/**
 * Get an avatar by index (useful for consistent assignment)
 */
export function getAvatarByIndex(index: number): string {
  return avatarBank[index % avatarBank.length];
}

/**
 * Get default avatar for a user based on their email/name
 * This provides a consistent but pseudo-random avatar assignment
 */
export function getDefaultAvatarForUser(identifier: string): string {
  // Create a simple hash from the identifier
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value to ensure positive index
  const index = Math.abs(hash);
  return getAvatarByIndex(index);
}