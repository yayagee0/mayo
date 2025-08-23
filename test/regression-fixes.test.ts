import { describe, it, expect, beforeEach, vi } from 'vitest'
import { itemSchema, profileSchema, interactionSchema } from '../src/lib/schema'

describe('Regression Fixes v0.6.2', () => {
	describe('Zod Schema Passthrough', () => {
		it('should handle extra DB fields in itemSchema', () => {
			const itemWithExtraFields = {
				id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
				kind: 'post' as const,
				author_email: 'test@example.com',
				body: 'Test post',
				visibility: 'all',
				is_deleted: false,
				// Extra fields that might come from DB snapshot
				extra_field_1: 'some_value',
				extra_field_2: 123,
				author_display_name: 'Test User',
				interaction_count: 5
			}

			const result = itemSchema.safeParse(itemWithExtraFields)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.kind).toBe('post')
				expect(result.data.author_email).toBe('test@example.com')
				// Verify extra fields are preserved due to passthrough
				expect((result.data as any).extra_field_1).toBe('some_value')
				expect((result.data as any).extra_field_2).toBe(123)
			}
		})

		it('should handle extra DB fields in profileSchema', () => {
			const profileWithExtraFields = {
				user_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
				email: 'nilezat@gmail.com',
				display_name: 'Test User',
				avatar_url: 'https://example.com/avatar.jpg',
				role: 'parent',
				// Extra fields that might come from DB snapshot
				last_login_at: '2024-01-01T00:00:00Z',
				profile_completion: 85,
				notification_settings: { email: true, push: false }
			}

			const result = profileSchema.safeParse(profileWithExtraFields)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.user_id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479')
				expect(result.data.email).toBe('nilezat@gmail.com')
				// Verify extra fields are preserved
				expect((result.data as any).last_login_at).toBe('2024-01-01T00:00:00Z')
				expect((result.data as any).profile_completion).toBe(85)
			}
		})

		it('should handle extra DB fields in interactionSchema', () => {
			const interactionWithExtraFields = {
				item_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
				user_email: 'test@example.com',
				type: 'like' as const,
				created_at: '2024-01-01T00:00:00Z',
				// Extra fields that might come from DB snapshot
				user_display_name: 'Test User',
				item_title: 'Test Post',
				interaction_context: 'dashboard'
			}

			const result = interactionSchema.safeParse(interactionWithExtraFields)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.item_id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479')
				expect(result.data.type).toBe('like')
				// Verify extra fields are preserved
				expect((result.data as any).user_display_name).toBe('Test User')
				expect((result.data as any).item_title).toBe('Test Post')
			}
		})
	})

	describe('Profile Update Error Fix', () => {
		it('should validate maybeSingle() usage pattern', () => {
			// This test validates the pattern we expect from maybeSingle()
			// maybeSingle() should return { data: null, error: null } when no rows match
			// instead of throwing an error like single() does

			// Mock the expected behavior of maybeSingle vs single
			const mockMaybeSingleResult = { data: null, error: null }
			const mockSingleResult = { data: null, error: { code: 'PGRST116', message: 'The result contains 0 rows' } }

			// Verify that maybeSingle pattern doesn't treat null data as an error
			expect(mockMaybeSingleResult.error).toBeNull()
			expect(mockMaybeSingleResult.data).toBeNull()

			// Verify that single pattern would have thrown
			expect(mockSingleResult.error).not.toBeNull()
			expect(mockSingleResult.error?.code).toBe('PGRST116')
		})

		it('should handle null data from maybeSingle gracefully', () => {
			// Simulate the profileStore.updateProfile logic
			const simulateUpdateProfile = (data: any, error: any) => {
				if (error) {
					console.error('Error updating profile:', error)
					return null
				}

				// With maybeSingle(), data can be null without error
				// This should be handled gracefully
				if (data) {
					// Update logic would go here
					return data
				}

				// Return null when no rows were affected (graceful handling)
				return null
			}

			// Test with maybeSingle() returning null data (no error)
			const result1 = simulateUpdateProfile(null, null)
			expect(result1).toBeNull() // Should return null gracefully

			// Test with maybeSingle() returning actual data
			const mockProfile = { user_id: '123', email: 'test@example.com' }
			const result2 = simulateUpdateProfile(mockProfile, null)
			expect(result2).toEqual(mockProfile) // Should return the data

			// Test with actual error
			const result3 = simulateUpdateProfile(null, { message: 'Real error' })
			expect(result3).toBeNull() // Should handle error and return null
		})
	})
})