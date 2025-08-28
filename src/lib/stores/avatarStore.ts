// src/lib/stores/avatarStore.ts
import { writable, derived, get } from 'svelte/store';
import { currentUserProfile, resolveAvatar } from './profileStore';

/**
 * Store to manage the current user's avatar URL
 * This ensures consistent avatar display across all components
 * Returns null if no avatar is set, allowing components to show initials fallback
 */
export const avatarStore = writable<string | null>(null);

// Auto-update avatar when profile changes
currentUserProfile.subscribe(async (profile) => {
  if (!profile) {
    avatarStore.set(null);
    return;
  }
  
  let avatarUrl: string | null = null;
  
  // Try to resolve the avatar from profile
  if (profile.avatar_url) {
    try {
      avatarUrl = await resolveAvatar(profile);
    } catch (error) {
      console.error('Error resolving avatar:', error);
    }
  }
  
  // No fallback to avatar bank - let components handle initials
  avatarStore.set(avatarUrl);
});

/**
 * Derived store that provides a reactive avatar URL
 * Returns null if no avatar is available, allowing components to show initials
 */
export const currentUserAvatar = derived(
  [avatarStore],
  ([$avatarUrl]) => $avatarUrl
);

/**
 * Function to manually refresh the avatar (useful after uploads)
 */
export async function refreshAvatar() {
  // Get current profile and update avatar
  const profile = get(currentUserProfile);
  if (!profile) return;
  
  let avatarUrl: string | null = null;
  
  // Try to resolve the avatar from profile
  if (profile.avatar_url) {
    try {
      avatarUrl = await resolveAvatar(profile);
    } catch (error) {
      console.error('Error resolving avatar:', error);
    }
  }
  
  // No fallback to avatar bank - let components handle initials
  avatarStore.set(avatarUrl);
}