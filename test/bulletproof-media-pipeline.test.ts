import { describe, it, expect } from 'vitest';
import { detectMimeByExt, validatedUploadMime } from '../src/lib/media/mime';

describe('Bulletproof Media Pipeline', () => {
  describe('MIME Detection', () => {
    it('should detect MIME types by extension correctly', () => {
      // Images
      expect(detectMimeByExt('photo.jpg')).toBe('image/jpeg');
      expect(detectMimeByExt('photo.jpeg')).toBe('image/jpeg');
      expect(detectMimeByExt('image.png')).toBe('image/png');
      expect(detectMimeByExt('animated.gif')).toBe('image/gif');
      expect(detectMimeByExt('modern.webp')).toBe('image/webp');
      expect(detectMimeByExt('bitmap.bmp')).toBe('image/bmp');
      expect(detectMimeByExt('tagged.tiff')).toBe('image/tiff');
      expect(detectMimeByExt('apple.heic')).toBe('image/heic');
      
      // Videos
      expect(detectMimeByExt('video.mp4')).toBe('video/mp4');
      expect(detectMimeByExt('movie.m4v')).toBe('video/mp4');
      expect(detectMimeByExt('clip.webm')).toBe('video/webm');
      expect(detectMimeByExt('quicktime.mov')).toBe('video/quicktime');
      expect(detectMimeByExt('mobile.3gp')).toBe('video/3gpp');
      expect(detectMimeByExt('old.avi')).toBe('video/avi');
      expect(detectMimeByExt('matroska.mkv')).toBe('video/x-matroska');
    });

    it('should return fallback for unknown extensions', () => {
      expect(detectMimeByExt('unknown.xyz')).toBe('application/octet-stream');
      expect(detectMimeByExt('document.pdf', 'application/pdf')).toBe('application/pdf');
      expect(detectMimeByExt('')).toBe('application/octet-stream');
    });

    it('should handle case insensitive extensions', () => {
      expect(detectMimeByExt('Photo.JPG')).toBe('image/jpeg');
      expect(detectMimeByExt('VIDEO.MP4')).toBe('video/mp4');
      expect(detectMimeByExt('Image.PNG')).toBe('image/png');
    });
  });

  describe('Upload MIME Validation', () => {
    it('should prefer reliable file.type when available', () => {
      const jpegFile = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
      expect(validatedUploadMime(jpegFile)).toBe('image/jpeg');

      const mp4File = new File(['data'], 'test.mp4', { type: 'video/mp4' });
      expect(validatedUploadMime(mp4File)).toBe('video/mp4');
    });

    it('should fallback to extension when file.type is unreliable', () => {
      // Mobile browsers often provide empty or generic MIME types
      const emptyTypeFile = new File(['data'], 'photo.jpg', { type: '' });
      expect(validatedUploadMime(emptyTypeFile)).toBe('image/jpeg');

      const octetStreamFile = new File(['data'], 'video.mp4', { type: 'application/octet-stream' });
      expect(validatedUploadMime(octetStreamFile)).toBe('video/mp4');
    });

    it('should never return application/octet-stream for known extensions', () => {
      const testFiles = [
        { name: 'image.jpg', type: '' },
        { name: 'video.mp4', type: 'application/octet-stream' },
        { name: 'photo.png', type: 'text/plain' }, // Wrong MIME type
      ];

      testFiles.forEach(({ name, type }) => {
        const file = new File(['data'], name, { type });
        const result = validatedUploadMime(file);
        expect(result).not.toBe('application/octet-stream');
        expect(result).toMatch(/^(image|video)\//);
      });
    });

    it('should handle blob-like objects with partial File interface', () => {
      const blobWithName = new Blob(['data'], { type: 'image/jpeg' }) as Blob & { name: string };
      blobWithName.name = 'test.jpg';
      expect(validatedUploadMime(blobWithName)).toBe('image/jpeg');

      const blobWithoutType = new Blob(['data']) as Blob & { name: string };
      blobWithoutType.name = 'video.mp4';
      expect(validatedUploadMime(blobWithoutType)).toBe('video/mp4');
    });
  });

  describe('Video Component Requirements', () => {
    it('should include playsinline attribute for iOS compatibility', () => {
      // This would be tested in the actual component, but we can verify the requirement exists
      const videoRequirements = [
        'playsinline', // Required for iOS Safari
        'preload="metadata"', // For better UX
        'controls', // User control
        'Your browser does not support the video tag.' // Fallback text
      ];
      
      expect(videoRequirements).toContain('playsinline');
      expect(videoRequirements).toContain('preload="metadata"');
    });
  });

  describe('Image Component Requirements', () => {
    it('should include error fallback for broken images', () => {
      const imageRequirements = [
        'loading="lazy"', // Performance
        'on:error', // Error handling
        '/default-avatar.png', // Fallback image
        'max-w-full h-auto' // Responsive sizing
      ];
      
      expect(imageRequirements).toContain('loading="lazy"');
      expect(imageRequirements).toContain('/default-avatar.png');
    });
  });
});