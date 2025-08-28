<script lang="ts">
  import { currentUserProfile, profileStore } from '$lib/stores/profileStore'
  import { session } from '$lib/stores/sessionStore'
  import { currentUserAvatar } from '$lib/stores/avatarStore'

  let uploading = false
  let error: string | null = null
  let fileInput: HTMLInputElement

  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    const file = input.files[0]
    if (!$session?.user?.id) return

    try {
      uploading = true
      error = null
      const url = await profileStore.uploadAvatar($session.user.id, file)
      if (!url) throw new Error('Upload failed')
    } catch (err) {
      console.error(err)
      error = err instanceof Error ? err.message : 'Failed to upload avatar'
    } finally {
      uploading = false
      if (fileInput) fileInput.value = ''
    }
  }

  function triggerFileInput() {
    fileInput?.click()
  }
</script>

<div class="flex flex-col items-center gap-2">
  {#if $currentUserAvatar}
    <img
      src="{$currentUserAvatar}?t={Date.now()}"
      alt="Profile Avatar"
      class="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
    />
  {:else}
    <div class="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
      {$currentUserProfile?.display_name?.charAt(0) || 'U'}
    </div>
  {/if}

  <input
    type="file"
    accept="image/*"
    bind:this={fileInput}
    on:change={handleFileChange}
    class="hidden"
  />

  <button
    class="btn btn-secondary text-sm"
    on:click={triggerFileInput}
    disabled={uploading}
  >
    {uploading ? 'Uploading...' : 'Upload Photo'}
  </button>

  {#if error}
    <p class="text-red-500 text-sm">{error}</p>
  {/if}
</div>
