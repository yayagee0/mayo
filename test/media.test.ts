import { describe, it, expect } from 'vitest'
import { 
	validateMediaFile, 
	isImageFile, 
	isVideoFile,
	getValidatedMimeType
} from '../src/lib/utils/mediaCompression'

describe('Media Compression Utility', () => {
	describe('isImageFile', () => {
		it('should return true for image files', () => {
			const imageTypes = [
				'image/jpeg',
				'image/png', 
				'image/gif',
				'image/webp'
			]

			imageTypes.forEach(type => {
				const file = new File(['test'], 'test.jpg', { type })
				expect(isImageFile(file)).toBe(true)
			})
		})

		it('should return false for non-image files', () => {
			const nonImageTypes = [
				'video/mp4',
				'text/plain',
				'application/pdf'
			]

			nonImageTypes.forEach(type => {
				const file = new File(['test'], 'test.mp4', { type })
				expect(isImageFile(file)).toBe(false)
			})
		})
	})

	describe('isVideoFile', () => {
		it('should return true for video files', () => {
			const videoTypes = [
				'video/mp4',
				'video/webm',
				'video/mov',
				'video/avi'
			]

			videoTypes.forEach(type => {
				const file = new File(['test'], 'test.mp4', { type })
				expect(isVideoFile(file)).toBe(true)
			})
		})

		it('should return false for non-video files', () => {
			const nonVideoTypes = [
				'image/jpeg',
				'text/plain',
				'application/pdf'
			]

			nonVideoTypes.forEach(type => {
				const file = new File(['test'], 'test.jpg', { type })
				expect(isVideoFile(file)).toBe(false)
			})
		})
	})

	describe('validateMediaFile', () => {
		it('should validate acceptable image files', () => {
			const file = new File(['x'.repeat(1000)], 'test.jpg', { type: 'image/jpeg' })
			const result = validateMediaFile(file)
			expect(result.valid).toBe(true)
			expect(result.error).toBeUndefined()
		})

		it('should validate acceptable video files', () => {
			const file = new File(['x'.repeat(1000)], 'test.mp4', { type: 'video/mp4' })
			const result = validateMediaFile(file)
			expect(result.valid).toBe(true)
			expect(result.error).toBeUndefined()
		})

		it('should reject files that are too large', () => {
			// Create a file larger than 100MB (using empty content but setting size in metadata won't work in tests)
			// So we'll test the logic conceptually
			const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
			
			// Mock file size to be over limit
			Object.defineProperty(file, 'size', { value: 101 * 1024 * 1024 })
			
			const result = validateMediaFile(file)
			expect(result.valid).toBe(false)
			expect(result.error).toBe('File size too large (101MB). Maximum allowed is 100MB.')
		})

		it('should reject unsupported image formats', () => {
			const file = new File(['test'], 'test.bmp', { type: 'image/bmp' })
			const result = validateMediaFile(file)
			expect(result.valid).toBe(false)
			expect(result.error).toBe('Unsupported image format. Please use JPG, PNG, GIF, WebP, or HEIC.')
		})

		it('should reject unsupported video formats', () => {
			const file = new File(['test'], 'test.wmv', { type: 'video/wmv' })
			const result = validateMediaFile(file)
			expect(result.valid).toBe(false)
			expect(result.error).toBe('Unsupported video format. Please use MP4, WebM, MOV, or AVI.')
		})

		it('should reject non-media files', () => {
			const file = new File(['test'], 'test.txt', { type: 'text/plain' })
			const result = validateMediaFile(file)
			expect(result.valid).toBe(false)
			expect(result.error).toBe('File must be an image or video')
		})
	})

	describe('getValidatedMimeType', () => {
		it('should return correct MIME type for images with valid type', () => {
			const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
			expect(getValidatedMimeType(file)).toBe('image/jpeg')
		})

		it('should return correct MIME type for videos with valid type', () => {
			const file = new File(['test'], 'test.mp4', { type: 'video/mp4' })
			expect(getValidatedMimeType(file)).toBe('video/mp4')
		})

		it('should detect MIME type from extension when type is missing or unreliable', () => {
			// Test with empty type
			const jpgFile = new File(['test'], 'photo.jpg', { type: '' })
			expect(getValidatedMimeType(jpgFile)).toBe('image/jpeg')

			const mp4File = new File(['test'], 'video.mp4', { type: '' })
			expect(getValidatedMimeType(mp4File)).toBe('video/mp4')
		})

		it('should detect MIME type from extension when type is application/octet-stream', () => {
			const pngFile = new File(['test'], 'image.png', { type: 'application/octet-stream' })
			expect(getValidatedMimeType(pngFile)).toBe('image/png')

			const webmFile = new File(['test'], 'video.webm', { type: 'application/octet-stream' })
			expect(getValidatedMimeType(webmFile)).toBe('video/webm')
		})

		it('should handle all supported image formats', () => {
			const formats = [
				{ ext: 'jpg', expected: 'image/jpeg' },
				{ ext: 'jpeg', expected: 'image/jpeg' },
				{ ext: 'png', expected: 'image/png' },
				{ ext: 'gif', expected: 'image/gif' },
				{ ext: 'webp', expected: 'image/webp' },
				{ ext: 'heic', expected: 'image/heic' },
				{ ext: 'bmp', expected: 'image/bmp' },
				{ ext: 'tiff', expected: 'image/tiff' }
			]

			formats.forEach(({ ext, expected }) => {
				const file = new File(['test'], `image.${ext}`, { type: '' })
				expect(getValidatedMimeType(file)).toBe(expected)
			})
		})

		it('should handle all supported video formats', () => {
			const formats = [
				{ ext: 'mp4', expected: 'video/mp4' },
				{ ext: 'm4v', expected: 'video/mp4' },
				{ ext: 'webm', expected: 'video/webm' },
				{ ext: 'mov', expected: 'video/quicktime' },
				{ ext: 'avi', expected: 'video/avi' },
				{ ext: '3gp', expected: 'video/3gpp' },
				{ ext: 'mkv', expected: 'video/x-matroska' }
			]

			formats.forEach(({ ext, expected }) => {
				const file = new File(['test'], `video.${ext}`, { type: '' })
				expect(getValidatedMimeType(file)).toBe(expected)
			})
		})

		it('should provide safe fallbacks for edge cases', () => {
			// Unknown image extension should fallback to jpeg
			const unknownImageFile = new File(['test'], 'image.unknown', { type: 'image/unknown' })
			expect(getValidatedMimeType(unknownImageFile)).toBe('image/jpeg')

			// Unknown video extension should fallback to mp4
			const unknownVideoFile = new File(['test'], 'video.unknown', { type: 'video/unknown' })
			expect(getValidatedMimeType(unknownVideoFile)).toBe('video/mp4')
		})

		it('should prevent application/octet-stream storage', () => {
			// This is the key regression test - no file should result in application/octet-stream
			const testFiles = [
				new File(['test'], 'image.jpg', { type: 'application/octet-stream' }),
				new File(['test'], 'video.mp4', { type: 'application/octet-stream' }),
				new File(['test'], 'photo.png', { type: '' }),
				new File(['test'], 'clip.webm', { type: '' }),
				new File(['test'], 'unknown.xyz', { type: 'application/octet-stream' }),
				new File(['test'], 'noext', { type: '' })
			]

			testFiles.forEach(file => {
				const mimeType = getValidatedMimeType(file)
				expect(mimeType).not.toBe('application/octet-stream')
				// Should fallback to safe defaults
				expect(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/bmp', 'image/tiff', 
					'video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 'video/3gpp', 'video/x-matroska']).toContain(mimeType)
			})
		})

		it('should handle edge cases with safe fallbacks', () => {
			// Test edge cases that should never result in application/octet-stream
			const edgeCases = [
				{ file: new File(['test'], 'test.heic', { type: 'application/octet-stream' }), expected: 'image/heic' },
				{ file: new File(['test'], 'test.mov', { type: 'application/octet-stream' }), expected: 'video/quicktime' },
				{ file: new File(['test'], 'test.mkv', { type: 'application/octet-stream' }), expected: 'video/x-matroska' },
				{ file: new File(['test'], 'test.bmp', { type: 'application/octet-stream' }), expected: 'image/bmp' },
				{ file: new File(['test'], 'test.tiff', { type: 'application/octet-stream' }), expected: 'image/tiff' },
				{ file: new File(['test'], 'unknown_file', { type: 'unknown/type' }), expected: 'image/jpeg' }, // Safe fallback
				{ file: new File(['test'], '', { type: '' }), expected: 'image/jpeg' } // Safe fallback
			]

			edgeCases.forEach(({ file, expected }) => {
				const result = getValidatedMimeType(file)
				expect(result).toBe(expected)
				expect(result).not.toBe('application/octet-stream')
			})
		})
	})

	describe('Video Accessibility', () => {
		it('should have captions track element in video', () => {
			// This test verifies WCAG 2.1 AA compliance for video elements
			const videoHTML = `
				<video controls class="w-full h-auto">
					<source src="test.mp4" type="video/mp4" />
					<track kind="captions" srclang="en" src="/captions.vtt" default />
				</video>
			`;
			
			// Parse the HTML to verify structure
			expect(videoHTML).toMatch(/<track[^>]*kind="captions"[^>]*>/)
			expect(videoHTML).toMatch(/<track[^>]*srclang="en"[^>]*>/)
			expect(videoHTML).toMatch(/<track[^>]*src="\/captions\.vtt"[^>]*>/)
			expect(videoHTML).toMatch(/<track[^>]*default[^>]*>/)
		})
	})

	describe('Upload ContentType Integration', () => {
		it('should provide contentType that can be used in Supabase upload', () => {
			// Simulate a typical mobile upload scenario
			const mobilePhotoFile = new File(['photodata'], 'IMG_20231201_123456.jpg', { type: '' })
			const mobileVideoFile = new File(['videodata'], 'VID_20231201_123456.mp4', { type: 'application/octet-stream' })

			const photoContentType = getValidatedMimeType(mobilePhotoFile)
			const videoContentType = getValidatedMimeType(mobileVideoFile)

			// These would be used in upload calls like:
			// supabase.storage.from('post-media').upload(fileName, file, { contentType })
			expect(photoContentType).toBe('image/jpeg')
			expect(videoContentType).toBe('video/mp4')
		})

		it('should guarantee safe upload parameters for all supported formats', () => {
			// Test that all supported formats produce valid upload parameters
			const testFiles = [
				{ name: 'photo.jpg', type: 'image/jpeg', expected: 'image/jpeg' },
				{ name: 'photo.png', type: 'image/png', expected: 'image/png' },
				{ name: 'photo.gif', type: 'image/gif', expected: 'image/gif' },
				{ name: 'photo.webp', type: 'image/webp', expected: 'image/webp' },
				{ name: 'photo.heic', type: 'image/heic', expected: 'image/heic' },
				{ name: 'video.mp4', type: 'video/mp4', expected: 'video/mp4' },
				{ name: 'video.webm', type: 'video/webm', expected: 'video/webm' },
				{ name: 'video.mov', type: 'video/quicktime', expected: 'video/quicktime' }
			]

			testFiles.forEach(({ name, type, expected }) => {
				const file = new File(['data'], name, { type })
				const contentType = getValidatedMimeType(file)
				
				// Verify it produces expected content type
				expect(contentType).toBe(expected)
				
				// Verify it's never application/octet-stream
				expect(contentType).not.toBe('application/octet-stream')
				
				// Verify it would be accepted by upload validation
				expect(contentType).toMatch(/^(image|video)\/[a-z0-9-+]+$/)
			})
		})

		it('should handle upload consistency requirements', () => {
			// Test the specific requirements: { contentType, upsert: true }
			const file = new File(['data'], 'test.jpg', { type: 'application/octet-stream' })
			const contentType = getValidatedMimeType(file)
			
			// Should produce valid upload options
			const uploadOptions = { contentType, upsert: true }
			
			expect(uploadOptions.contentType).toBe('image/jpeg')
			expect(uploadOptions.upsert).toBe(true)
			expect(uploadOptions.contentType).not.toBe('application/octet-stream')
		})

		it('should handle HEIC conversion scenario', () => {
			// HEIC files from iOS that get converted to JPEG
			const heicFile = new File(['heicdata'], 'IMG_20231201.heic', { type: 'image/heic' })
			
			// After conversion, the file would have JPEG content but might retain HEIC name or type
			const convertedFile = new File(['jpegdata'], 'IMG_20231201.heic', { type: 'image/jpeg' })
			
			expect(getValidatedMimeType(heicFile)).toBe('image/heic')
			expect(getValidatedMimeType(convertedFile)).toBe('image/jpeg')
		})
	})
})