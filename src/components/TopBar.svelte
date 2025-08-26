<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { profileStore, currentUserProfile } from '$lib/stores/profileStore';
  import { HeartHandshake, User } from 'lucide-svelte';

  export let userName: string = 'Friend';

  let secondaryMessage = "Loading...";

  async function fetchLatestPost() {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('author_email, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        if (data.author_email !== $currentUserProfile?.email) {
          const authorProfile = profileStore.findByEmail(data.author_email);
          const recentAuthor = authorProfile?.display_name || data.author_email.split('@')[0];
          secondaryMessage = `${recentAuthor} posted something today 💌`;
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

      <!-- Greeting -->
      <div class="text-right">
        <p class="text-sm font-medium text-gray-900">
          🌿 Salam {userName}
        </p>
        <p class="text-xs text-gray-500">
          {secondaryMessage}
        </p>

        {#if $currentUserProfile}
          {@const profile = $currentUserProfile}
          {#if profile?.avatar_url}
            <img
              src="{profile.avatar_url}?t={Date.now()}"
              alt={profile.display_name || 'User avatar'}
              class="w-10 h-10 rounded-full object-cover border-2 border-gray-200 inline-block ml-2"
            />
          {:else}
            <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 ml-2">
              {profile?.display_name?.charAt(0) || 'U'}
            </div>
          {/if}
        {:else}
          <User class="w-6 h-6 text-gray-600 ml-2" aria-hidden="true" />
        {/if}
      </div>
    </div>
  </div>
</header>