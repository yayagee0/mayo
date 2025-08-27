/**
 * Lazy loading utilities using IntersectionObserver for performance optimization
 * Implements lazy loading for quiet widgets while keeping anchor widgets preloaded
 */

interface LazyLoadOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
}

interface LazyLoadCallback {
  (entry: IntersectionObserverEntry): void
}

class LazyLoader {
  private observer: IntersectionObserver | null = null
  private callbacks = new Map<Element, LazyLoadCallback>()

  constructor(options: LazyLoadOptions = {}) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const callback = this.callbacks.get(entry.target)
              if (callback) {
                callback(entry)
                this.unobserve(entry.target)
              }
            }
          })
        },
        {
          root: options.root || null,
          rootMargin: options.rootMargin || '100px 0px',
          threshold: options.threshold || 0.1
        }
      )
    }
  }

  observe(element: Element, callback: LazyLoadCallback) {
    if (!this.observer) {
      // Fallback for environments without IntersectionObserver
      callback({
        target: element,
        isIntersecting: true,
        intersectionRatio: 1,
        time: Date.now(),
        rootBounds: null,
        boundingClientRect: element.getBoundingClientRect()
      } as IntersectionObserverEntry)
      return
    }

    this.callbacks.set(element, callback)
    this.observer.observe(element)
  }

  unobserve(element: Element) {
    if (this.observer) {
      this.observer.unobserve(element)
    }
    this.callbacks.delete(element)
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
    }
    this.callbacks.clear()
  }
}

// Widget classification for lazy loading strategy
export const ANCHOR_WIDGETS = [
  'reflectionMood',  // Mood ("How are you feeling today?")
  'ayah',           // Daily Ayah
  'birthday',       // BirthdayCard (mandatory if birthday data exists)
  'quiz',           // Quiz / Identity Game → All users
  'scenario',       // Scenario Q&A → Children only
  'closingRitual'   // Closing Ritual (always visible)
] as const

export const QUIET_WIDGETS = [
  'wall',                      // Wall (limit to 5 latest posts)
  'weeklyReflectionDigest',    // Family Reflections Digest → Parents only
  'analytics',                 // Family Insights → Parents only  
  'islamicQA',                 // Islamic Q&A → Children only
  'islamicReflectionDigest',   // Islamic Reflection Digest → Parents only
  'scenarioDigest',            // Scenario Reflection Digest → Parents only
  'professionCard',            // Family Professions → All users
  'agePlayground',             // Age Playground → All users
  'profileQuiz'                // Legacy - merged into unified QuizCard
] as const

export function isAnchorWidget(widgetId: string): boolean {
  return ANCHOR_WIDGETS.includes(widgetId as any)
}

export function isQuietWidget(widgetId: string): boolean {
  return QUIET_WIDGETS.includes(widgetId as any)
}

// Singleton instance for the app
export const lazyLoader = new LazyLoader({
  rootMargin: '50px 0px', // Load when 50px away from viewport
  threshold: 0.1
})

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    lazyLoader.disconnect()
  })
}