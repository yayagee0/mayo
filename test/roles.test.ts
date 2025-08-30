import { describe, it, expect } from 'vitest'
import { 
	isEmailAllowed, 
	getAllowedEmails,
	validateUserAccess,
	FAMILY_ID
} from '../src/lib/allowlist'

describe('Firebase Auth and Allowlist Utilities', () => {
	describe('Allowed emails validation', () => {
		it('should contain exactly 4 family emails', () => {
			const allowedEmails = getAllowedEmails()
			expect(allowedEmails).toHaveLength(4)
			expect(allowedEmails).toContain('nilezat@gmail.com')
			expect(allowedEmails).toContain('abdessamia.mariem@gmail.com')
			expect(allowedEmails).toContain('yazidgeemail@gmail.com')
			expect(allowedEmails).toContain('yahyageemail@gmail.com')
		})

		it('should return true for allowed family emails', () => {
			const allowedEmails = getAllowedEmails()
			allowedEmails.forEach(email => {
				expect(isEmailAllowed(email)).toBe(true)
			})
		})

		it('should return false for non-allowed emails', () => {
			const deniedEmails = [
				'stranger@gmail.com',
				'hacker@evil.com',
				'test@example.com'
			]

			deniedEmails.forEach(email => {
				expect(isEmailAllowed(email)).toBe(false)
			})
		})

		it('should return false for null, undefined, or empty email', () => {
			expect(isEmailAllowed(null)).toBe(false)
			expect(isEmailAllowed(undefined)).toBe(false)
			expect(isEmailAllowed('')).toBe(false)
		})

		it('should handle case-insensitive email validation', () => {
			expect(isEmailAllowed('NILEZAT@GMAIL.COM')).toBe(true)
			expect(isEmailAllowed('Nilezat@Gmail.Com')).toBe(true)
			expect(isEmailAllowed('HACKER@EVIL.COM')).toBe(false)
		})
	})

	describe('validateUserAccess function', () => {
		it('should return true for users with allowed emails', () => {
			const allowedEmails = getAllowedEmails()
			allowedEmails.forEach(email => {
				expect(validateUserAccess({ email })).toBe(true)
			})
		})

		it('should return false for users with disallowed emails', () => {
			expect(validateUserAccess({ email: 'hacker@evil.com' })).toBe(false)
		})

		it('should return false for users without email', () => {
			expect(validateUserAccess({})).toBe(false)
			expect(validateUserAccess({ email: null })).toBe(false)
			expect(validateUserAccess({ email: undefined })).toBe(false)
		})
	})

	describe('Family ID constant', () => {
		it('should have the correct family ID', () => {
			expect(FAMILY_ID).toBe('ghassan-family')
		})
	})
})