import { z } from 'zod'

/**
 * Item kind validation schema
 */
export const itemKindSchema = z.enum(['post', 'comment', 'event', 'ayah', 'poll', 'tip', 'system'])

export type ItemKind = z.infer<typeof itemKindSchema>

/**
 * Item visibility validation schema
 */
export const itemVisibilitySchema = z.enum(['all', 'parents', 'owner'])

export type ItemVisibility = z.infer<typeof itemVisibilitySchema>

/**
 * Base item validation schema
 */
export const itemSchema = z.object({
	id: z.string().uuid().optional(),
	kind: itemKindSchema,
	author_id: z.string().uuid().nullish(),
	author_email: z.string().email(),
	visibility: itemVisibilitySchema.nullish().default('all'),
	body: z.string().nullish(),
	media_urls: z.array(z.string().url()).nullish(),
	parent_id: z.string().uuid().nullish(),
	start_at: z.string().datetime().nullish(),
	end_at: z.string().datetime().nullish(),
	data: z.record(z.string(), z.any()).nullish().default({}),
	is_deleted: z.boolean().nullish().default(false),
	created_at: z.string().datetime().nullish(),
	updated_at: z.string().datetime().nullish()
})

export type ItemData = z.infer<typeof itemSchema>

/**
 * Post creation schema
 */
export const postCreateSchema = z.object({
	kind: z.literal('post'),
	author_email: z.string().email(),
	author_id: z.string().uuid().optional(),
	body: z.string().min(1, 'Post content is required'),
	visibility: itemVisibilitySchema.default('all')
})

export type PostCreateData = z.infer<typeof postCreateSchema>

/**
 * Poll data schema for the data field
 */
export const pollDataSchema = z.object({
	type: z.literal('feedback'),
	mood: z.string().min(1, 'Mood is required'),
	feedback: z.string().min(1, 'Feedback is required'),
	role: z.string().min(1, 'Role is required')
})

export type PollData = z.infer<typeof pollDataSchema>

/**
 * Poll creation schema
 */
export const pollCreateSchema = z.object({
	kind: z.literal('poll'),
	author_email: z.string().email(),
	author_id: z.string().uuid().optional(),
	body: z.string().min(1, 'Poll question is required'),
	data: pollDataSchema,
	visibility: itemVisibilitySchema.default('all')
})

export type PollCreateData = z.infer<typeof pollCreateSchema>