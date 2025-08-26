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
  "/avatars/avatar-7.svg",  // Young boy (7 years) - playful blue
  "/avatars/avatar-8.svg",  // Young boy (11 years) - playful green
  "/avatars/avatar-9.svg",  // Young boy - playful orange with curly hair
  "/avatars/avatar-10.svg", // Woman (mid-30s) - elegant purple with long hair
  "/avatars/avatar-11.svg", // Woman (mid-30s) - warm coral with side part
  "/avatars/avatar-12.svg", // Woman (mid-30s) - soft teal with bob cut
  "/avatars/avatar-13.svg", // Man (early 40s) - professional navy with beard
  "/avatars/avatar-14.svg", // Man (early 40s) - casual brown with goatee
  "/avatars/avatar-15.svg", // Man (early 40s) - creative green with glasses and beard
  "/avatars/avatar-16.svg", // Fun avatar - bright rainbow gradient
  "/avatars/avatar-17.svg", // Exaggerated cartoon - cosmic theme
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