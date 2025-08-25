// Test setup for Mayo app
import { vi } from 'vitest'

// Mock environment variables for tests
vi.mock('$env/static/public', () => ({
	PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
	PUBLIC_SUPABASE_ANON_KEY: 'test-key'
}))

// Mock environment for tests - ensure mocks are used
Object.defineProperty(import.meta, 'env', {
	value: {
		VITEST: true,
		VITE_USE_MOCKS: 'true',
		NODE_ENV: 'test'
	},
	writable: true,
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
	value: {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
	},
	writable: true,
})

// Console warnings for mock usage (helps verify mocks are working)
console.warn = vi.fn()
console.log = vi.fn()