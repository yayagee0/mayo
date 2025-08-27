<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { supabase } from '$lib/supabase';
  import { currentUserProfile } from '$lib/stores/profileStore';
  import { resolveAvatar } from '$lib/stores/profileStore';
  import { HeartHandshake, User } from 'lucide-svelte';

  export let userName: string = 'Friend';

  let secondaryMessage = "Loading...";
  let avatarSignedUrl: string | null = null;

  // Keep avatar in sync with profile
  $: if ($currentUserProfile) {
    resolveAvatar($currentUserProfile)
      .then((url) => (avatarSignedUrl = url))
      .catch(() => (avatarSignedUrl = null));
  } else {
    avatarSignedUrl = null;
  }

  async function fetchLatestPost() {
    if (!browser) return; // Skip during SSR
    
    try {
      const { data, error } = await supabase
        .from('items')
        .select('author_email, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        if (data.author_email !== $currentUserProfile?.email) {
          secondaryMessage = `${data.author_email.split('@')[0]} posted something today 💌`;
          return;
        }
      }
      secondaryMessage = "Good to see you, family is waiting ❤️";
    } catch (err) {
      console.error("TopBar fetch error:", err);
      secondaryMessage = "Good to see you, family is waiting ❤️";
    }
  }

  onMount(fetchLatestPost);
</script>

<header class="bg-white border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    <div class="flex items-center justify-between">
      
      <!-- Brand -->
      <div class="flex items-center gap-3">
        <HeartHandshake class="w-8 h-8 text-primary-600" aria-hidden="true" />
        <div>
          <h1 class="text-xl font-bold text-gray-900">FamilyNest</h1>
          <p class="text-sm text-gray-600">Your family's sacred space</p>
        </div>
      </div>

      <!-- Greeting + Avatar -->
      <div class="flex items-center gap-2">
        <div class="text-right">
          <p class="text-sm font-medium text-gray-900">
            🌿 Salam {userName}
          </p>
          <p class="text-xs text-gray-500">
            {secondaryMessage}
          </p>
        </div>

        {#if avatarSignedUrl}
          <img
            src={avatarSignedUrl}
            alt={$currentUserProfile?.display_name || 'User avatar'}
            class="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
          />
        {:else if $currentUserProfile}
          <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
            {$currentUserProfile?.display_name?.charAt(0) || 'U'}
          </div>
        {:else}
          <User class="w-6 h-6 text-gray-600" aria-hidden="true" />
        {/if}
      </div>
    </div>
  </div>
</header>
