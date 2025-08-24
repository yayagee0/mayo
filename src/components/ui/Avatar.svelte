<script lang="ts">
  import Avatar from './Avatar.svelte';
  import { profileStore, currentUserProfile } from '$lib/stores/profileStore';
  import { session } from '$lib/stores/sessionStore';

  let uploading = false;
  let error: string | null = null;

  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !$session?.user?.id) return;

    const file = input.files[0];
    uploading = true;
    error = null;

    try {
      const url = await profileStore.uploadAvatar($session.user.id, file);
      if (!url) {
        error = 'Failed to upload avatar';
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      error = 'Upload failed. Please try again.';
    } finally {
      uploading = false;
    }
  }
</script>

<div class="flex flex-col items-center space-y-3">
  <Avatar
    src={$currentUserProfile?.avatar_url || undefined}
    alt={$currentUserProfile?.display_name || $session?.user?.email || 'User'}
    size="xl"
  />

  <label class="cursor-pointer bg-primary-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-primary-700">
    {uploading ? 'Uploading...' : 'Change Photo'}
    <input type="file" accept="image/*" class="hidden" on:change={handleFileChange} />
  </label>

  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {/if}
</div>
