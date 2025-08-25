<script lang="ts">
  import { avatarBank } from '$lib/avatarBank';
  import { profileStore } from '$lib/stores/profileStore';
  import { session } from '$lib/stores/sessionStore';

  interface Props {
    onSelection?: (avatarPath: string) => void;
    selectedAvatar?: string | null;
  }

  let { onSelection, selectedAvatar }: Props = $props();

  let selecting = $state(false);

  async function selectAvatar(avatarPath: string) {
    if (!$session?.user?.id) return;
    
    try {
      selecting = true;
      // Update profile with the selected avatar bank path
      await profileStore.updateProfile($session.user.id, { avatar_url: avatarPath });
      onSelection?.(avatarPath);
    } catch (err) {
      console.error('Error selecting avatar:', err);
    } finally {
      selecting = false;
    }
  }
</script>

<div class="space-y-4">
  <h3 class="text-lg font-semibold text-gray-900">Choose from Avatar Bank</h3>
  <p class="text-sm text-gray-600">Select one of our pre-designed avatars</p>
  
  <div class="grid grid-cols-5 gap-3">
    {#each avatarBank as avatar, index}
      <button
        onclick={() => selectAvatar(avatar)}
        disabled={selecting}
        class="relative w-14 h-14 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        class:border-primary-500={selectedAvatar === avatar}
        class:ring-2={selectedAvatar === avatar}
        class:ring-primary-500={selectedAvatar === avatar}
        class:ring-offset-2={selectedAvatar === avatar}
        class:border-gray-200={selectedAvatar !== avatar}
        aria-label="Select avatar {index + 1}"
      >
        <img 
          src={avatar} 
          alt="Avatar option {index + 1}"
          class="w-full h-full rounded-full object-cover"
        />
        
        {#if selectedAvatar === avatar}
          <div class="absolute inset-0 bg-primary-500 bg-opacity-20 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        {/if}
      </button>
    {/each}
  </div>
  
  {#if selecting}
    <div class="text-center text-sm text-gray-500">
      Updating avatar...
    </div>
  {/if}
</div>