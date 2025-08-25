/**
 * Test suite for Supabase mocking system
 * Validates that mocks work correctly and prevent egress usage
 */

import { describe, it, expect, vi } from 'vitest'
import { mockSupabaseClient } from '../src/lib/supabase.mock'
import { subscribeRealtime } from '../src/lib/subscribeRealtime'

describe('Supabase Mocking System', () => {
  describe('Mock Client Basic Operations', () => {
    it('should return mock data from profiles table', async () => {
      const result = await mockSupabaseClient
        .from('profiles')
        .select('*')
      
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(4)
      expect(result.data[0]).toMatchObject({
        email: 'nilezat@gmail.com',
        display_name: 'Ghassan',
        role: 'parent'
      })
    })

    it('should support filtering with eq()', async () => {
      const result = await mockSupabaseClient
        .from('profiles')
        .select('*')
        .eq('role', 'child')
      
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(2)
      expect(result.data.every(profile => profile.role === 'child')).toBe(true)
    })

    it('should support single() queries', async () => {
      const result = await mockSupabaseClient
        .from('profiles')
        .select('*')
        .eq('email', 'nilezat@gmail.com')
        .single()
      
      expect(result.error).toBeNull()
      expect(result.data).toMatchObject({
        email: 'nilezat@gmail.com',
        display_name: 'Ghassan'
      })
    })

    it('should support maybeSingle() queries', async () => {
      const result = await mockSupabaseClient
        .from('profiles')
        .select('*')
        .eq('email', 'nonexistent@example.com')
        .maybeSingle()
      
      expect(result.error).toBeNull()
      expect(result.data).toBeNull()
    })

    it('should support insert operations', async () => {
      const newProfile = {
        user_id: 'test-uuid',
        email: 'test@example.com',
        display_name: 'Test User',
        role: 'member'
      }

      const result = await mockSupabaseClient
        .from('profiles')
        .insert(newProfile)
      
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toMatchObject(newProfile)
      expect(result.data[0].id).toBeDefined()
      expect(result.data[0].created_at).toBeDefined()
    })

    it('should support update operations', async () => {
      const updateData = { display_name: 'Updated Name' }
      
      const result = await mockSupabaseClient
        .from('profiles')
        .update(updateData)
        .eq('email', 'nilezat@gmail.com')
      
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].display_name).toBe('Updated Name')
      expect(result.data[0].updated_at).toBeDefined()
    })
  })

  describe('Mock Auth System', () => {
    it('should mock signInWithOAuth', async () => {
      const result = await mockSupabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'http://localhost:5173/dashboard' }
      })

      expect(result.error).toBeNull()
      expect(result.data.provider).toBe('google')
      expect(result.data.url).toContain('mock-oauth-url')
    })

    it('should mock getUser', async () => {
      const result = await mockSupabaseClient.auth.getUser()

      expect(result.error).toBeNull()
      expect(result.data.user).toMatchObject({
        id: 'mock-uuid-1',
        email: 'nilezat@gmail.com'
      })
    })

    it('should mock getSession', async () => {
      const result = await mockSupabaseClient.auth.getSession()

      expect(result.error).toBeNull()
      expect(result.data.session).toMatchObject({
        access_token: 'mock-token',
        user: {
          id: 'mock-uuid-1',
          email: 'nilezat@gmail.com'
        }
      })
    })
  })

  describe('Mock Storage System', () => {
    it('should mock file upload', async () => {
      const mockFile = new Blob(['test'], { type: 'text/plain' })
      
      const result = await mockSupabaseClient.storage
        .from('post-media')
        .upload('test/file.txt', mockFile)

      expect(result.error).toBeNull()
      expect(result.data.path).toContain('mock/test/file.txt')
      expect(result.data.id).toBeDefined()
    })

    it('should mock signed URL creation', async () => {
      const result = await mockSupabaseClient.storage
        .from('post-media')
        .createSignedUrl('test/file.txt', 3600)

      expect(result.error).toBeNull()
      expect(result.data.signedUrl).toContain('mock-storage.com')
      expect(result.data.signedUrl).toContain('token=mock-token')
    })

    it('should mock file listing', async () => {
      const result = await mockSupabaseClient.storage
        .from('post-media')
        .list()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(2)
      expect(result.data[0]).toMatchObject({
        name: 'mock-file-1.jpg',
        id: 'mock-file-1'
      })
    })
  })

  describe('Realtime Guard System', () => {
    it('should prevent realtime subscriptions in test environment', () => {
      // Mock console.warn to capture warnings
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const unsubscribe = subscribeRealtime(
        'test-channel',
        'INSERT',
        () => {},
        mockSupabaseClient
      )

      // Should have warned about skipping subscription
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Realtime Guard] Skipping realtime subscription'),
        expect.objectContaining({
          channelName: 'test-channel',
          event: 'INSERT'
        })
      )

      // Should return a no-op function
      expect(typeof unsubscribe).toBe('function')

      // Calling unsubscribe should also warn
      unsubscribe()
      expect(warnSpy).toHaveBeenCalledWith('[Realtime Guard] No-op unsubscribe called')

      warnSpy.mockRestore()
    })
  })

  describe('Environment Detection', () => {
    it('should work in test environment', () => {
      // Just verify that we're in a testing context where mocks should work
      // The actual environment detection logic is tested implicitly by other tests working
      expect(typeof window).toBe('object') // We're in JSDOM
      expect(typeof import.meta).toBe('object') // We have import.meta
    })
  })
})