/**
 * PWA utilities for install prompt and offline detection
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private isInstallable = false
  private isOffline = false

  constructor() {
    this.init()
  }

  private init() {
    if (typeof window === 'undefined') return

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e as BeforeInstallPromptEvent
      this.isInstallable = true
      this.notifyInstallAvailable()
    })

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null
      this.isInstallable = false
      this.notifyAppInstalled()
    })

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOffline = false
      this.notifyOnlineStatus(true)
    })

    window.addEventListener('offline', () => {
      this.isOffline = true
      this.notifyOnlineStatus(false)
    })

    // Check initial online status
    this.isOffline = !navigator.onLine
  }

  canInstall(): boolean {
    return this.isInstallable && this.deferredPrompt !== null
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false
    }

    try {
      await this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      
      this.deferredPrompt = null
      this.isInstallable = false
      
      return outcome === 'accepted'
    } catch (error) {
      console.error('Error showing install prompt:', error)
      return false
    }
  }

  isAppOffline(): boolean {
    return this.isOffline
  }

  private notifyInstallAvailable() {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('pwa-install-available'))
  }

  private notifyAppInstalled() {
    window.dispatchEvent(new CustomEvent('pwa-app-installed'))
  }

  private notifyOnlineStatus(isOnline: boolean) {
    window.dispatchEvent(new CustomEvent('pwa-online-status', { 
      detail: { isOnline } 
    }))
  }

  // Register service worker
  async registerServiceWorker(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker installed, notify user
              window.dispatchEvent(new CustomEvent('pwa-update-available'))
            }
          })
        }
      })

      return true
    } catch (error) {
      console.error('Service worker registration failed:', error)
      return false
    }
  }
}

// Singleton instance
export const pwaManager = new PWAManager()

// Convenience functions
export function canInstallPWA(): boolean {
  return pwaManager.canInstall()
}

export function showInstallPrompt(): Promise<boolean> {
  return pwaManager.showInstallPrompt()
}

export function isOffline(): boolean {
  return pwaManager.isAppOffline()
}

export function registerServiceWorker(): Promise<boolean> {
  return pwaManager.registerServiceWorker()
}