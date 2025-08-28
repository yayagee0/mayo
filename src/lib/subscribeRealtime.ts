/**
 * Realtime Subscription Guard
 * Prevents realtime subscriptions in test/dev environments to save egress quota
 */

import { dev } from '$app/environment'

/**
 * Guards realtime subscriptions - only allows in production
 * Logs warnings in test/dev and returns no-op functions
 */
export function subscribeRealtime<T>(
  channelName: string,
  event: string,
  callback: (payload: T) => void,
  supabaseClient: any
): () => void {
  // Check if we're in test environment
  const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test'
  const isVitestEnv = typeof import.meta !== 'undefined' && import.meta.env?.VITEST
  const useMocks = typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCKS === 'true'
  
  // Skip subscriptions in test, dev with mocks, or vitest environment
  if (isTest || isVitestEnv || useMocks || dev) {
    console.warn(
      `[Realtime Guard] Skipping realtime subscription in ${
        isTest ? 'test' : 
        isVitestEnv ? 'vitest' : 
        useMocks ? 'mock' : 
        'dev'
      } environment:`,
      { channelName, event }
    )
    
    // Return no-op unsubscribe function
    return () => {
      console.warn('[Realtime Guard] No-op unsubscribe called')
    }
  }
  
  // Only in production - create actual subscription
  console.log('[Realtime] Creating subscription:', { channelName, event })
  
  const channel = supabaseClient
    .channel(channelName)
    .on('postgres_changes', { event, schema: 'public' }, callback)
    .subscribe()
  
  // Return actual unsubscribe function
  return () => {
    console.log('[Realtime] Unsubscribing from:', { channelName, event })
    supabaseClient.removeChannel(channel)
  }
}

/**
 * Helper for item changes subscription
 */
export function subscribeToItems(
  callback: (payload: any) => void,
  supabaseClient: any
): () => void {
  return subscribeRealtime('items', 'INSERT', callback, supabaseClient)
}

/**
 * Helper for interaction changes subscription  
 */
export function subscribeToInteractions(
  callback: (payload: any) => void,
  supabaseClient: any
): () => void {
  return subscribeRealtime('interactions', 'INSERT', callback, supabaseClient)
}

/**
 * Helper for profile changes subscription
 */
export function subscribeToProfiles(
  callback: (payload: any) => void,
  supabaseClient: any
): () => void {
  return subscribeRealtime('profiles', 'UPDATE', callback, supabaseClient)
}