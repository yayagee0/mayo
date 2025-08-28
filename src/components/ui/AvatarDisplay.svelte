<!--
  Unified Avatar Display Component
  
  Props:
  - profile: Profile object with avatar_url, display_name, email
  - size: 'sm' | 'md' | 'lg' | 'xl' (optional, defaults to 'md')
  - class: additional CSS classes (optional)
-->
<script lang="ts">
  import { resolveAvatar } from '$lib/stores/profileStore';
  import type { Profile } from '$lib/stores/profileStore';

  interface Props {
    profile: Profile | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    class?: string;
  }

  let { profile, size = 'md', class: className = '' }: Props = $props();

  let avatarUrl = $state<string | null>(null);
  let imageError = $state(false);

  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm', 
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg'
  };

  // Get initials from profile
  function getInitials(profile: Profile | null): string {
    if (!profile) return 'U';
    
    if (profile.display_name) {
      return profile.display_name.charAt(0).toUpperCase();
    }
    
    if (profile.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  }

  // Reactive avatar resolution
  $effect(() => {
    if (profile?.avatar_url && !imageError) {
      resolveAvatar(profile).then(resolved => {
        avatarUrl = resolved;
      }).catch(error => {
        console.error('Error resolving avatar:', error);
        avatarUrl = null;
        imageError = true;
      });
    } else {
      avatarUrl = null;
    }
  });

  function handleImageError() {
    imageError = true;
    avatarUrl = null;
  }
</script>

{#if avatarUrl && !imageError}
  <img 
    src={avatarUrl}
    alt="{profile?.display_name || 'User'}'s avatar"
    class="rounded-full object-cover border-2 border-gray-200 {sizeClasses[size]} {className}"
    onerror={handleImageError}
  />
{:else}
  <div 
    class="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold border-2 border-gray-200 {sizeClasses[size]} {className}"
    aria-label="{profile?.display_name || 'User'}'s avatar"
  >
    {getInitials(profile)}
  </div>
{/if}