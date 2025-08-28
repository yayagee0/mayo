import { writable } from 'svelte/store'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../supabase'

export const session = writable<Session | null>(null)
export const user = writable<User | null>(null)

// Initialize session on app load
supabase.auth.getSession().then(({ data }) => {
  session.set(data.session)
  user.set(data.session?.user ?? null)
})

// Listen for auth changes
supabase.auth.onAuthStateChange((event, newSession) => {
  session.set(newSession)
  user.set(newSession?.user ?? null)
})

/**
 * Validates current session and refreshes if needed
 * Returns true if session is valid, false if refresh failed
 */
export async function validateAndRefreshSession(): Promise<boolean> {
  try {
    const { data: { session: currentSession }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return false
    }
    
    if (!currentSession) {
      return false
    }
    
    // Check if token is close to expiry (within 5 minutes)
    const expiresAt = currentSession.expires_at
    if (expiresAt && (expiresAt * 1000 - Date.now()) < 5 * 60 * 1000) {
      console.log('Session near expiry, refreshing...')
      const { data, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('Session refresh failed:', refreshError)
        return false
      }
      
      if (data.session) {
        session.set(data.session)
        user.set(data.session.user)
        return true
      }
    }
    
    return true
  } catch (error) {
    console.error('Session validation failed:', error)
    return false
  }
}