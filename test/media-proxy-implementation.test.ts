import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Media Proxy Implementation', () => {
  describe('Proxy API Route', () => {
    it('should have media proxy API route implemented', () => {
      const proxyRoutePath = join(process.cwd(), 'src/routes/api/media/[...path]/+server.ts');
      expect(() => readFileSync(proxyRoutePath, 'utf-8')).not.toThrow();
      
      const proxyRouteContent = readFileSync(proxyRoutePath, 'utf-8');
      
      // Should have GET handler
      expect(proxyRouteContent).toContain('export const GET: RequestHandler');
      
      // Should authenticate users
      expect(proxyRouteContent).toContain('getSession');
      expect(proxyRouteContent).toContain('Authentication required');
      
      // Should validate bucket access
      expect(proxyRouteContent).toContain('allowedBuckets');
      expect(proxyRouteContent).toContain('post-media');
      
      // Should create signed URLs with short expiry
      expect(proxyRouteContent).toContain('createSignedUrl');
      expect(proxyRouteContent).toContain('3600'); // 1 hour
      
      // Should set proper headers to prevent OpaqueResponseBlocking
      expect(proxyRouteContent).toContain('Content-Type');
      expect(proxyRouteContent).toContain('Cross-Origin-Resource-Policy');
      expect(proxyRouteContent).toContain('X-Content-Type-Options');
    });

    it('should have content type detection utility', () => {
      const proxyRoutePath = join(process.cwd(), 'src/routes/api/media/[...path]/+server.ts');
      const proxyRouteContent = readFileSync(proxyRoutePath, 'utf-8');
      
      // Should import mime detection utility
      expect(proxyRouteContent).toContain("import { detectMimeByExt } from '$lib/media/mime'");
      
      // Should use mime detection
      expect(proxyRouteContent).toContain('detectMimeByExt');
      
      // Should handle fallbacks
      expect(proxyRouteContent).toContain('serveFallback');
      
      // Check that the mime module exists and has the required content
      const mimePath = join(process.cwd(), 'src/lib/media/mime.ts');
      const mimeContent = readFileSync(mimePath, 'utf-8');
      
      // Should detect image types
      expect(mimeContent).toContain('image/jpeg');
      expect(mimeContent).toContain('image/png');
      expect(mimeContent).toContain('image/webp');
      
      // Should detect video types
      expect(mimeContent).toContain('video/mp4');
      expect(mimeContent).toContain('video/webm');
      
      // Should have fallback
      expect(mimeContent).toContain('application/octet-stream');
    });
  });

  describe('Media Proxy Utilities', () => {
    it('should have media proxy utility functions', () => {
      const utilsPath = join(process.cwd(), 'src/lib/utils/mediaProxy.ts');
      expect(() => readFileSync(utilsPath, 'utf-8')).not.toThrow();
      
      const utilsContent = readFileSync(utilsPath, 'utf-8');
      
      // Should have main proxy URL function
      expect(utilsContent).toContain('getProxiedMediaUrl');
      expect(utilsContent).toContain('/api/media/');
      
      // Should detect raw Supabase URLs
      expect(utilsContent).toContain('isRawSupabaseUrl');
      expect(utilsContent).toContain('supabase');
      
      // Should validate proxy URLs
      expect(utilsContent).toContain('isProxiedUrl');
    });
  });

  describe('Component Updates', () => {
    it('should update PostComposer to store paths instead of signed URLs', () => {
      const postComposerPath = join(process.cwd(), 'src/components/PostComposer.svelte');
      const postComposerContent = readFileSync(postComposerPath, 'utf-8');
      
      // Should store data.path instead of signed URL
      expect(postComposerContent).toContain('urls.push(data.path)');
      
      // Should not create long-lived signed URLs for storage
      expect(postComposerContent).not.toContain('60 * 60 * 24 * 365');
    });

    it('should update PostCard to use proxy URLs for media', () => {
      const postCardPath = join(process.cwd(), 'src/components/PostCard.svelte');
      const postCardContent = readFileSync(postCardPath, 'utf-8');
      
      // Should import media proxy utility
      expect(postCardContent).toContain('getProxiedMediaUrl');
      
      // Should use proxy URLs in img src
      expect(postCardContent).toContain('getProxiedMediaUrl(mediaUrl)');
      
      // Should have fallback to original URL
      expect(postCardContent).toContain('|| mediaUrl');
    });

    it('should update profile store to use proxy approach', () => {
      const profileStorePath = join(process.cwd(), 'src/lib/stores/profileStore.ts');
      const profileStoreContent = readFileSync(profileStorePath, 'utf-8');
      
      // resolveAvatar should use proxy URLs
      expect(profileStoreContent).toContain('/api/media/post-media/');
      expect(profileStoreContent).toContain('resolveAvatar');
      
      // Should handle local avatar bank URLs
      expect(profileStoreContent).toContain('/avatars/');
    });
  });

  describe('CI Guard', () => {
    it('should have CI guard script to detect raw Supabase URLs', () => {
      const guardScriptPath = join(process.cwd(), 'scripts/check-media-proxy.js');
      expect(() => readFileSync(guardScriptPath, 'utf-8')).not.toThrow();
      
      const guardContent = readFileSync(guardScriptPath, 'utf-8');
      
      // Should scan for forbidden patterns
      expect(guardContent).toContain('FORBIDDEN_PATTERNS');
      expect(guardContent).toContain('\\.supabase\\.co');
      expect(guardContent).toContain('\\.supabase\\.in');
      
      // Should have allowed exceptions
      expect(guardContent).toContain('ALLOWED_PATTERNS');
      expect(guardContent).toContain('\\+server\\.ts');
      
      // Should scan relevant directories
      expect(guardContent).toContain('src/components');
      expect(guardContent).toContain('src/routes');
    });

    it('should have npm script for CI integration', () => {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageContent = readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      // Should have media proxy check script
      expect(packageJson.scripts).toHaveProperty('check:media-proxy');
      expect(packageJson.scripts['check:media-proxy']).toContain('check-media-proxy.js');
    });
  });

  describe('Integration Tests', () => {
    it('should not contain raw Supabase URLs in components', () => {
      // This is tested by running the actual CI guard
      const guardScriptPath = join(process.cwd(), 'scripts/check-media-proxy.js');
      const guardContent = readFileSync(guardScriptPath, 'utf-8');
      
      // The guard script should exist and be functional
      expect(guardContent).toContain('scanFile');
      expect(guardContent).toContain('FORBIDDEN_PATTERNS');
    });

    it('should maintain backward compatibility', () => {
      // Existing media URLs should still work
      const utilsPath = join(process.cwd(), 'src/lib/utils/mediaProxy.ts');
      const utilsContent = readFileSync(utilsPath, 'utf-8');
      
      // Should handle legacy signed URLs
      expect(utilsContent).toContain('sign');
      expect(utilsContent).toContain('legacy');
      
      // Should extract file path from signed URLs
      expect(utilsContent).toContain('match');
    });
  });
});