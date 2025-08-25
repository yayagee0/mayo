// src/lib/stores/avatarStore.ts
import { writable, derived } from 'svelte/store';
import { currentUserProfile, resolveAvatar } from './profileStore';
import { getDefaultAvatarForUser } from '$lib/avatarBank';

/**
 * Store to manage the current user's avatar URL with proper fallback logic
 * This ensures consistent avatar display across all components
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
  
  // Fall back to default avatar bank if no resolved URL
  if (!avatarUrl) {
    const identifier = profile.email || profile.display_name || 'user';
    avatarUrl = getDefaultAvatarForUser(identifier);
  }
  
  avatarStore.set(avatarUrl);
});

/**
 * Derived store that provides a reactive avatar URL with fallback
 */
export const currentUserAvatar = derived(
  [avatarStore, currentUserProfile],
  ([$avatarUrl, $profile]) => {
    if ($avatarUrl) return $avatarUrl;
    
    // Final fallback if everything else fails
    if ($profile) {
      const identifier = $profile.email || $profile.display_name || 'user';
      return getDefaultAvatarForUser(identifier);
    }
    
    return null;
  }
);

/**
 * Function to manually refresh the avatar (useful after uploads)
 */
export async function refreshAvatar() {
  // Trigger the subscription to re-run
  const profile = currentUserProfile;
  profile.subscribe(async (p) => {
    if (p) {
      let avatarUrl: string | null = null;
      
      if (p.avatar_url) {
        try {
          avatarUrl = await resolveAvatar(p);
        } catch (error) {
          console.error('Error resolving avatar:', error);
        }
      }
      
      if (!avatarUrl) {
        const identifier = p.email || p.display_name || 'user';
        avatarUrl = getDefaultAvatarForUser(identifier);
      }
      
      avatarStore.set(avatarUrl);
    }
  })();
}