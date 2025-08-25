<!--
  PWA Install Prompt Component
  Shows install prompt for supported browsers when PWA can be installed
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import { Download, X } from 'lucide-svelte'
  import { showInstallPrompt } from '$lib/utils/pwa'

  let showPrompt = $state(false)
  let isInstalling = $state(false)

  onMount(() => {
    // Check if user already dismissed this session
    if (typeof sessionStorage !== 'undefined' && 
        sessionStorage.getItem('pwa-install-dismissed')) {
      showPrompt = false
    }

    // Listen for PWA install availability
    const handleInstallAvailable = () => {
      showPrompt = true
    }

    const handleAppInstalled = () => {
      showPrompt = false
    }

    window.addEventListener('pwa-install-available', handleInstallAvailable)
    window.addEventListener('pwa-app-installed', handleAppInstalled)

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable)
      window.removeEventListener('pwa-app-installed', handleAppInstalled)
    }
  })

  async function handleInstall() {
    if (isInstalling) return

    isInstalling = true
    try {
      const installed = await showInstallPrompt()
      if (installed) {
        showPrompt = false
      }
    } catch (error) {
      console.error('Install failed:', error)
    } finally {
      isInstalling = false
    }
  }

  function dismissPrompt() {
    showPrompt = false
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }
</script>

{#if showPrompt}
  <div class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
    <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Download class="w-5 h-5 text-blue-600" aria-hidden="true" />
        </div>
        
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-gray-900 mb-1">
            Install Mayo App
          </h3>
          <p class="text-xs text-gray-600 mb-3">
            Add Mayo to your home screen for quick access and offline viewing.
          </p>
          
          <div class="flex gap-2">
            <button
              type="button"
              onclick={handleInstall}
              disabled={isInstalling}
              class="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {#if isInstalling}
                Installing...
              {:else}
                <Download class="w-3 h-3" aria-hidden="true" />
                Install
              {/if}
            </button>
            
            <button
              type="button"
              onclick={dismissPrompt}
              class="text-gray-500 text-xs px-3 py-1.5 rounded-md hover:text-gray-700 hover:bg-gray-100"
            >
              Not now
            </button>
          </div>
        </div>

        <button
          type="button"
          onclick={dismissPrompt}
          class="text-gray-400 hover:text-gray-600 flex-shrink-0"
          aria-label="Dismiss install prompt"
        >
          <X class="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
{/if}