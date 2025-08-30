// Test setup for Mayo app
import { vi } from 'vitest'

// Mock Firebase environment variables for tests
Object.defineProperty(import.meta, 'env', {
	value: {
		VITEST: true,
		VITE_USE_MOCKS: 'true',
		NODE_ENV: 'test',
		VITE_FB_API_KEY: 'test-firebase-api-key',
		VITE_FB_AUTH_DOMAIN: 'test-project.firebaseapp.com',
		VITE_FB_PROJECT_ID: 'test-project-id',
		VITE_FB_STORAGE_BUCKET: 'test-project.appspot.com',
		VITE_FB_APP_ID: 'test-firebase-app-id',
		VITE_FAMILY_ID: 'ghassan-family',
		VITE_ALLOWED_EMAILS: 'nilezat@gmail.com,abdessamia.mariem@gmail.com,yazidgeemail@gmail.com,yahyageemail@gmail.com'
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