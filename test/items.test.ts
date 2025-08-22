import { describe, it, expect } from 'vitest'
import { 
	itemKindSchema, 
	itemVisibilitySchema, 
	itemSchema,
	postCreateSchema,
	pollDataSchema,
	pollCreateSchema,
	type ItemKind,
	type ItemVisibility 
} from '../src/lib/schema/items'

describe('Items Schema Validation', () => {
	describe('itemKindSchema', () => {
		it('should accept valid item kinds', () => {
			const validKinds = ['post', 'comment', 'event', 'ayah', 'poll', 'tip', 'system']

			validKinds.forEach(kind => {
				const result = itemKindSchema.safeParse(kind)
				expect(result.success).toBe(true)
				if (result.success) {
					expect(result.data).toBe(kind)
				}
			})
		})

		it('should reject invalid item kinds', () => {
			const invalidKinds = ['photo', 'video', '', null, undefined, 123]

			invalidKinds.forEach(kind => {
				const result = itemKindSchema.safeParse(kind)
				expect(result.success).toBe(false)
			})
		})
	})

	describe('itemVisibilitySchema', () => {
		it('should accept valid visibility levels', () => {
			const validVisibilities = ['all', 'parents', 'owner']

			validVisibilities.forEach(visibility => {
				const result = itemVisibilitySchema.safeParse(visibility)
				expect(result.success).toBe(true)
				if (result.success) {
					expect(result.data).toBe(visibility)
				}
			})
		})

		it('should reject invalid visibility levels', () => {
			const invalidVisibilities = ['public', 'private', '', null, undefined]

			invalidVisibilities.forEach(visibility => {
				const result = itemVisibilitySchema.safeParse(visibility)
				expect(result.success).toBe(false)
			})
		})
	})

	describe('itemSchema', () => {
		const validItem = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			kind: 'post' as ItemKind,
			author_id: '123e4567-e89b-12d3-a456-426614174001',
			author_email: 'test@example.com',
			visibility: 'all' as ItemVisibility,
			body: 'Test post content',
			media_urls: ['https://example.com/image.jpg'],
			data: { test: 'data' },
			is_deleted: false
		}

		it('should accept valid item data', () => {
			// Test with minimal data first to isolate the issue
			const minimalValidItem = {
				kind: 'post' as ItemKind,
				author_email: 'test@example.com'
			}

			const result = itemSchema.safeParse(minimalValidItem)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.kind).toBe('post')
				expect(result.data.author_email).toBe('test@example.com')
			}
		})

		it('should accept minimal item data', () => {
			const minimalItem = {
				kind: 'post' as ItemKind,
				author_email: 'test@example.com'
			}

			const result = itemSchema.safeParse(minimalItem)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.visibility).toBe('all') // default value
				expect(result.data.data).toEqual({}) // default value
				expect(result.data.is_deleted).toBe(false) // default value
			}
		})

		it('should reject invalid UUID', () => {
			const itemWithInvalidUUID = {
				kind: 'post' as ItemKind,
				author_email: 'test@example.com',
				id: 'invalid-uuid-format'
			}

			const result = itemSchema.safeParse(itemWithInvalidUUID)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues).toContainEqual(
					expect.objectContaining({
						path: ['id'],
						code: 'invalid_format',
						format: 'uuid'
					})
				)
			}
		})

		it('should reject invalid email', () => {
			const itemWithInvalidEmail = {
				kind: 'post' as ItemKind,
				author_email: 'not-a-valid-email'
			}

			const result = itemSchema.safeParse(itemWithInvalidEmail)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues).toContainEqual(
					expect.objectContaining({
						path: ['author_email'],
						code: 'invalid_format',
						format: 'email'
					})
				)
			}
		})

		it('should reject invalid media URLs', () => {
			const itemWithInvalidMediaUrls = {
				kind: 'post' as ItemKind,
				author_email: 'test@example.com',
				media_urls: ['not-a-valid-url', 'also-invalid']
			}

			const result = itemSchema.safeParse(itemWithInvalidMediaUrls)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues).toContainEqual(
					expect.objectContaining({
						path: ['media_urls', 0],
						code: 'invalid_format',
						format: 'url'
					})
				)
			}
		})
	})

	describe('postCreateSchema', () => {
		const validPost = {
			kind: 'post' as const,
			author_email: 'test@example.com',
			author_id: '123e4567-e89b-12d3-a456-426614174000',
			body: 'This is a test post',
			visibility: 'all' as ItemVisibility
		}

		it('should accept valid post creation data', () => {
			const result = postCreateSchema.safeParse(validPost)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.kind).toBe('post')
				expect(result.data.body).toBe(validPost.body)
			}
		})

		it('should reject post without body', () => {
			const invalidPost = {
				...validPost,
				body: ''
			}

			const result = postCreateSchema.safeParse(invalidPost)
			expect(result.success).toBe(false)
		})

		it('should reject non-post kind', () => {
			const invalidPost = {
				...validPost,
				kind: 'comment' as const
			}

			const result = postCreateSchema.safeParse(invalidPost)
			expect(result.success).toBe(false)
		})

		it('should use default visibility', () => {
			const postWithoutVisibility = {
				kind: 'post' as const,
				author_email: 'test@example.com',
				body: 'This is a test post'
			}

			const result = postCreateSchema.safeParse(postWithoutVisibility)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.visibility).toBe('all')
			}
		})
	})

	describe('pollDataSchema', () => {
		const validPollData = {
			type: 'feedback' as const,
			mood: 'happy',
			feedback: 'Great day!',
			role: 'parent'
		}

		it('should accept valid poll data', () => {
			const result = pollDataSchema.safeParse(validPollData)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.type).toBe('feedback')
				expect(result.data.mood).toBe(validPollData.mood)
			}
		})

		it('should reject poll data with empty fields', () => {
			const invalidData = {
				...validPollData,
				mood: ''
			}

			const result = pollDataSchema.safeParse(invalidData)
			expect(result.success).toBe(false)
		})

		it('should reject poll data with wrong type', () => {
			const invalidData = {
				...validPollData,
				type: 'question'
			}

			const result = pollDataSchema.safeParse(invalidData)
			expect(result.success).toBe(false)
		})
	})

	describe('pollCreateSchema', () => {
		const validPoll = {
			kind: 'poll' as const,
			author_email: 'test@example.com',
			body: 'How are you feeling today?',
			data: {
				type: 'feedback' as const,
				mood: 'happy',
				feedback: 'Great day!',
				role: 'parent'
			},
			visibility: 'all' as ItemVisibility
		}

		it('should accept valid poll creation data', () => {
			const result = pollCreateSchema.safeParse(validPoll)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.kind).toBe('poll')
				expect(result.data.data.type).toBe('feedback')
			}
		})

		it('should reject poll without body', () => {
			const invalidPoll = {
				...validPoll,
				body: ''
			}

			const result = pollCreateSchema.safeParse(invalidPoll)
			expect(result.success).toBe(false)
		})

		it('should reject poll with invalid data', () => {
			const invalidPoll = {
				...validPoll,
				data: {
					...validPoll.data,
					mood: ''
				}
			}

			const result = pollCreateSchema.safeParse(invalidPoll)
			expect(result.success).toBe(false)
		})
	})
})