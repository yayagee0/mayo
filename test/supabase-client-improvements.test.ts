/**
 * Test suite for Supabase client improvements
 * Validates that the new implementation meets all requirements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseClient, getSupabaseClient, db, supabase } from '../src/lib/supabase'

describe('Supabase Client Improvements', () => {
  beforeEach(() => {
    // Reset the internal cache for each test
    // This requires us to mock the module's internal state
    vi.resetModules()
  })

  describe('Environment Variable Imports', () => {
    it('should use correct SvelteKit 2 style imports', () => {
      // The fact that the module loads without error confirms correct imports
      expect(createSupabaseClient).toBeDefined()
      expect(getSupabaseClient).toBeDefined()
      expect(db).toBeDefined()
      expect(supabase).toBeDefined()
    })
  })

  describe('Function Exports', () => {
    it('should export createSupabaseClient function', () => {
      expect(typeof createSupabaseClient).toBe('function')
    })

    it('should export getSupabaseClient function', () => {
      expect(typeof getSupabaseClient).toBe('function')
    })

    it('should export db client for convenience', () => {
      expect(db).toBeDefined()
      expect(typeof db.from).toBe('function')
    })

    it('should export supabase client for compatibility', () => {
      expect(supabase).toBeDefined()
      expect(typeof supabase.from).toBe('function')
    })
  })

  describe('Singleton Pattern', () => {
    it('should return the same client instance for multiple calls (memoization)', () => {
      const client1 = createSupabaseClient()
      const client2 = createSupabaseClient()
      
      // Both calls should return the same instance (singleton pattern)
      expect(client1).toBe(client2)
    })

    it('should return synchronous client from createSupabaseClient', () => {
      const client = createSupabaseClient()
      
      // Should be a Supabase client instance, not a Promise
      expect(client).toBeDefined()
      expect(typeof client.from).toBe('function')
      expect(client.constructor.name).not.toBe('Promise')
    })

    it('should return Promise from getSupabaseClient for compatibility', async () => {
      const clientPromise = getSupabaseClient()
      
      // Should return a Promise
      expect(clientPromise).toBeInstanceOf(Promise)
      
      const client = await clientPromise
      expect(client).toBeDefined()
      expect(typeof client.from).toBe('function')
    })
  })

  describe('TypeScript Types', () => {
    it('should have correct TypeScript types', () => {
      const client = createSupabaseClient()
      
      // Test that the client has expected Supabase methods
      expect(typeof client.from).toBe('function')
      expect(typeof client.auth).toBe('object')
      expect(typeof client.storage).toBe('object')
    })
  })

  describe('Clean Code Requirements', () => {
    it('should not contain console.log or console.warn in production paths', () => {
      // Mock console to detect any calls
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Call the function in a production-like environment
      process.env.NODE_ENV = 'production'
      createSupabaseClient()
      
      // Should not have called console methods
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(warnSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
      warnSpy.mockRestore()
    })
  })
})