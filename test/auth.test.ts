import { describe, it, expect, vi } from 'vitest'
import { isEmailAllowed, validateUserAccess, getAllowedEmails } from '../src/lib/allowlist'

// Mock Firebase auth for testing
vi.mock('../src/lib/firebase', () => ({
  auth: {
    currentUser: null
  },
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  createOrUpdateUser: vi.fn(),
  getUser: vi.fn()
}))

describe('Firebase Auth Integration', () => {
  describe('Email Allowlist Validation', () => {
    it('should validate allowed family emails', () => {
      const allowedEmails = [
        'nilezat@gmail.com',
        'abdessamia.mariem@gmail.com',
        'yazidgeemail@gmail.com',
        'yahyageemail@gmail.com'
      ]

      allowedEmails.forEach(email => {
        expect(isEmailAllowed(email)).toBe(true)
      })
    })

    it('should reject non-family emails', () => {
      const rejectedEmails = [
        'invalid@example.com',
        'test@gmail.com',
        'hacker@evil.com',
        '',
        null,
        undefined
      ]

      rejectedEmails.forEach(email => {
        expect(isEmailAllowed(email as any)).toBe(false)
      })
    })

    it('should handle case-insensitive validation', () => {
      expect(isEmailAllowed('NILEZAT@GMAIL.COM')).toBe(true)
      expect(isEmailAllowed('Nilezat@Gmail.Com')).toBe(true)
    })
  })

  describe('User Access Validation', () => {
    it('should validate user with allowed email', () => {
      const validUser = { email: 'nilezat@gmail.com' }
      expect(validateUserAccess(validUser)).toBe(true)
    })

    it('should reject user with invalid email', () => {
      const invalidUser = { email: 'invalid@example.com' }
      expect(validateUserAccess(invalidUser)).toBe(false)
    })

    it('should reject user without email', () => {
      expect(validateUserAccess({})).toBe(false)
      expect(validateUserAccess({ email: null })).toBe(false)
    })
  })

  describe('Allowlist Configuration', () => {
    it('should return exactly 4 allowed emails', () => {
      const emails = getAllowedEmails()
      expect(emails).toHaveLength(4)
      expect(emails).toContain('nilezat@gmail.com')
      expect(emails).toContain('abdessamia.mariem@gmail.com')
      expect(emails).toContain('yazidgeemail@gmail.com')
      expect(emails).toContain('yahyageemail@gmail.com')
    })

    it('should return a copy of the allowlist (not the original)', () => {
      const emails1 = getAllowedEmails()
      const emails2 = getAllowedEmails()
      
      // Should be equal but not the same reference
      expect(emails1).toEqual(emails2)
      expect(emails1).not.toBe(emails2)
    })
  })
})