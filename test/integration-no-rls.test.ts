/**
 * Integration test for the complete RLS-free + mocking system
 * Validates the entire implementation works as expected
 */

import { describe, it, expect, vi } from 'vitest'
import { mockSupabaseClient } from '../src/lib/supabase.mock'
import { subscribeRealtime, subscribeToItems } from '../src/lib/subscribeRealtime'
import { isEmailAllowed, validateUserAccess, getUserRole } from '../src/lib/server/allowlist'

describe('FamilyNest No-RLS Integration Tests', () => {
  describe('Complete Security Model', () => {
    it('should enforce allowlist-only security without RLS', () => {
      // Test the allowlist enforcement (replaces RLS)
      expect(isEmailAllowed('nilezat@gmail.com')).toBe(true)
      expect(isEmailAllowed('random@hacker.com')).toBe(false)
      
      // Test role assignment
      expect(getUserRole('nilezat@gmail.com')).toBe('parent')
      expect(getUserRole('yazidgeemail@gmail.com')).toBe('child')
      
      // Test validation
      expect(() => validateUserAccess('nilezat@gmail.com')).not.toThrow()
      expect(() => validateUserAccess('hacker@evil.com')).toThrow()
    })

    it('should handle case-insensitive email validation', () => {
      // Case insensitive matching (good security practice)
      expect(isEmailAllowed('NILEZAT@GMAIL.COM')).toBe(true)
      expect(isEmailAllowed('Nilezat@Gmail.Com')).toBe(true)
      
      // But still reject unknown emails regardless of case
      expect(isEmailAllowed('HACKER@EVIL.COM')).toBe(false)
    })
  })

  describe('Complete Data Operations (No RLS)', () => {
    it('should perform all CRUD operations without RLS restrictions', async () => {
      // Since RLS is disabled, authenticated users have full access
      
      // Create - should work for any authenticated user
      const newItem = {
        kind: 'text',
        author_id: 'mock-uuid-1',
        author_email: 'nilezat@gmail.com',
        body: 'Test post without RLS restrictions',
        visibility: 'all'
      }
      
      const createResult = await mockSupabaseClient
        .from('items')
        .insert(newItem)
        
      expect(createResult.error).toBeNull()
      expect(createResult.data).toHaveLength(1)
      
      // Read - should work for any authenticated user (no row filtering)
      const readResult = await mockSupabaseClient
        .from('items')
        .select('*')
        
      expect(readResult.error).toBeNull()
      expect(readResult.data.length).toBeGreaterThan(1) // Original + new item
      
      // Update - should work for any authenticated user
      const updateResult = await mockSupabaseClient
        .from('items')
        .update({ body: 'Updated without RLS' })
        .eq('id', createResult.data[0].id)
        
      expect(updateResult.error).toBeNull()
      expect(updateResult.data[0].body).toBe('Updated without RLS')
      
      // Delete would also work for any authenticated user (no RLS restrictions)
    })

    it('should access all profiles without RLS filtering', async () => {
      // With RLS disabled, authenticated users can see all profiles
      const result = await mockSupabaseClient
        .from('profiles')
        .select('*')
        
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(4) // All family members visible
      
      // Can access any profile directly
      const specificProfile = await mockSupabaseClient
        .from('profiles')
        .select('*')
        .eq('email', 'abdessamia.mariem@gmail.com')
        .single()
        
      expect(specificProfile.error).toBeNull()
      expect(specificProfile.data.display_name).toBe('Mariem')
    })
  })

  describe('Egress Protection & Mocking', () => {
    it('should prevent real Supabase calls in test environment', () => {
      // Mock client should log warnings for debugging
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Auth operations should be mocked
      mockSupabaseClient.auth.getUser()
      expect(warnSpy).toHaveBeenCalledWith('[Mock] getUser called')
      
      // Storage operations should be mocked
      mockSupabaseClient.storage.from('post-media').list()
      expect(warnSpy).toHaveBeenCalledWith(
        '[Mock] storage.list called:',
        expect.objectContaining({ bucket: 'post-media' })
      )
      
      warnSpy.mockRestore()
    })

    it('should block realtime subscriptions in test/dev', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Realtime should be blocked
      const unsubscribe = subscribeToItems(() => {}, mockSupabaseClient)
      
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Realtime Guard] Skipping realtime subscription'),
        expect.objectContaining({ event: 'INSERT' })
      )
      
      // Should return no-op function
      unsubscribe()
      expect(warnSpy).toHaveBeenCalledWith('[Realtime Guard] No-op unsubscribe called')
      
      warnSpy.mockRestore()
    })
  })

  describe('Family Data Access (No RLS)', () => {
    it('should handle islamic questions for all authenticated users', async () => {
      // With RLS disabled, all authenticated users can access all Islamic questions
      const result = await mockSupabaseClient
        .from('islamic_questions')
        .select('*')
        
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toMatchObject({
        question_text: 'What should we say before eating?',
        explanation_correct: expect.stringContaining('Excellent!'),
        explanation_incorrect: expect.stringContaining('That\'s okay!')
      })
    })

    it('should handle reflections without user restrictions', async () => {
      // No RLS means any authenticated user can see all reflections
      const result = await mockSupabaseClient
        .from('reflections')
        .select('*')
        
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].mood_emoji).toBe('😊')
      
      // Can create reflections for any user
      const newReflection = {
        user_id: 'mock-uuid-2',
        mood_emoji: '🙂',
        reflection_text: 'Grateful for mocking system',
        week_start: '2024-01-08'
      }
      
      const createResult = await mockSupabaseClient
        .from('reflections')
        .insert(newReflection)
        
      expect(createResult.error).toBeNull()
    })
  })

  describe('Schema Compliance', () => {
    it('should match the expected no-RLS schema structure', () => {
      // Verify mock data structure matches schema
      const tableChecks = [
        { table: 'profiles', requiredFields: ['user_id', 'email', 'display_name', 'role'] },
        { table: 'items', requiredFields: ['id', 'kind', 'author_email', 'body'] },
        { table: 'reflections', requiredFields: ['id', 'mood_emoji', 'week_start'] },
        { table: 'islamic_questions', requiredFields: ['question_text', 'options', 'explanation_correct'] }
      ]
      
      tableChecks.forEach(({ table, requiredFields }) => {
        const builder = mockSupabaseClient.from(table as any)
        expect(builder).toBeDefined()
        
        // Verify data structure by checking first record
        builder.select('*').then(result => {
          if (result.data && result.data.length > 0) {
            const record = result.data[0]
            requiredFields.forEach(field => {
              expect(record).toHaveProperty(field)
            })
          }
        })
      })
    })
  })
})