/**
 * PWA Service Worker Management
 * Handles registration and unregistration based on PUBLIC_ENABLE_PWA flag
 */

export function handleServiceWorker(enabled: boolean): void {
  if ('serviceWorker' in navigator) {
    if (enabled) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    } else {
      // Unregister all existing service workers when PWA is disabled
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            console.log('Service Worker unregistered:', registration);
          });
        });
      }).catch((error) => {
        console.error('Service Worker unregistration failed:', error);
      });
    }
  }
}