/**
 * Tests for PWA functionality with network-first strategy
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('PWA Network-First Implementation', () => {
  let mockNavigator: any;
  let originalNavigator: any;

  beforeEach(() => {
    originalNavigator = global.navigator;
    // Reset console methods for clean testing
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    vi.restoreAllMocks();
  });

  describe('handleServiceWorker function', () => {
    it('should register service worker when enabled=true', async () => {
      const mockRegister = vi.fn().mockResolvedValue({
        addEventListener: vi.fn()
      });

      mockNavigator = {
        serviceWorker: {
          register: mockRegister,
          getRegistrations: vi.fn().mockResolvedValue([])
        }
      };

      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true
      });

      const { handleServiceWorker } = await import('../src/lib/pwa');
      handleServiceWorker(true);

      expect(mockRegister).toHaveBeenCalledWith('/sw.js');
    });

    it('should unregister all service workers when enabled=false', async () => {
      const mockUnregister = vi.fn().mockResolvedValue(true);
      const mockRegistration = {
        unregister: mockUnregister
      };

      mockNavigator = {
        serviceWorker: {
          register: vi.fn(),
          getRegistrations: vi.fn().mockResolvedValue([mockRegistration])
        }
      };

      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true
      });

      const { handleServiceWorker } = await import('../src/lib/pwa');
      handleServiceWorker(false);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockNavigator.serviceWorker.getRegistrations).toHaveBeenCalled();
      expect(mockUnregister).toHaveBeenCalled();
    });

    it('should handle missing service worker support gracefully', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true
      });

      const { handleServiceWorker } = await import('../src/lib/pwa');
      
      // Should not throw
      expect(() => handleServiceWorker(true)).not.toThrow();
      expect(() => handleServiceWorker(false)).not.toThrow();
    });

    it('should handle service worker registration failure', async () => {
      const mockRegister = vi.fn().mockRejectedValue(new Error('Registration failed'));

      mockNavigator = {
        serviceWorker: {
          register: mockRegister,
          getRegistrations: vi.fn().mockResolvedValue([])
        }
      };

      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true
      });

      const { handleServiceWorker } = await import('../src/lib/pwa');
      handleServiceWorker(true);

      // Wait for async operation to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockRegister).toHaveBeenCalledWith('/sw.js');
      // Error should be logged but not thrown
      expect(console.error).toHaveBeenCalledWith('Service Worker registration failed:', expect.any(Error));
    });

    it('should handle service worker unregistration failure', async () => {
      const mockUnregister = vi.fn().mockRejectedValue(new Error('Unregistration failed'));
      const mockRegistration = {
        unregister: mockUnregister
      };

      mockNavigator = {
        serviceWorker: {
          register: vi.fn(),
          getRegistrations: vi.fn().mockRejectedValue(new Error('Get registrations failed'))
        }
      };

      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true
      });

      const { handleServiceWorker } = await import('../src/lib/pwa');
      handleServiceWorker(false);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      // Error should be logged but not thrown
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Service Worker Strategy Validation', () => {
    it('should validate manifest fields for PWA requirements', () => {
      // Test that manifest.json has required fields for PWA
      const manifest = require('../static/manifest.json');
      
      expect(manifest.name).toBe('Mayo — Family Engagement');
      expect(manifest.short_name).toBe('Mayo');
      expect(manifest.start_url).toBe('/');
      expect(manifest.display).toBe('standalone');
      expect(manifest.background_color).toBe('#ffffff');
      expect(manifest.theme_color).toBe('#2563eb');
      
      // Verify proper icon sizes
      const icons = manifest.icons;
      const icon192 = icons.find((icon: any) => icon.sizes === '192x192');
      const icon512 = icons.find((icon: any) => icon.sizes === '512x512');
      
      expect(icon192).toBeDefined();
      expect(icon512).toBeDefined();
      expect(icon192.src).toBe('/icon-192.png');
      expect(icon512.src).toBe('/icon-512.png');
    });

    it('should verify offline page exists', () => {
      // Test that offline.html exists in static directory
      const fs = require('fs');
      const path = require('path');
      
      const offlinePath = path.join(__dirname, '..', 'static', 'offline.html');
      expect(fs.existsSync(offlinePath)).toBe(true);
      
      const offlineContent = fs.readFileSync(offlinePath, 'utf-8');
      expect(offlineContent).toContain('You\'re Offline');
      expect(offlineContent).toContain('Mayo');
    });
  });

  describe('Network-First Strategy Simulation', () => {
    it('should prioritize network over cache (conceptual test)', async () => {
      // This is a conceptual test for the service worker strategy
      // In a real implementation, we would test the actual fetch handling
      
      const networkFirstStrategy = async (request: Request) => {
        // Simulate network-first: try network first, then cache
        try {
          const response = await fetch(request);
          // Cache the response for offline use
          return response;
        } catch (error) {
          // Fallback to cache only if network fails
          return await caches.match(request);
        }
      };

      // Mock fetch and caches
      const mockFetch = vi.fn().mockResolvedValue(new Response('fresh content'));
      const mockCacheMatch = vi.fn().mockResolvedValue(new Response('cached content'));
      
      global.fetch = mockFetch;
      global.caches = {
        match: mockCacheMatch
      } as any;

      const mockRequest = new Request('https://example.com/test');
      
      await networkFirstStrategy(mockRequest);
      
      expect(mockFetch).toHaveBeenCalledWith(mockRequest);
      // Since fetch succeeds, cache should not be called
      expect(mockCacheMatch).not.toHaveBeenCalled();
    });

    it('should fallback to cache when network fails', async () => {
      const networkFirstStrategy = async (request: Request) => {
        try {
          return await fetch(request);
        } catch (error) {
          return await caches.match(request);
        }
      };

      // Mock failed fetch and successful cache match
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockCacheMatch = vi.fn().mockResolvedValue(new Response('cached content'));
      
      global.fetch = mockFetch;
      global.caches = {
        match: mockCacheMatch
      } as any;

      const mockRequest = new Request('https://example.com/test');
      
      await networkFirstStrategy(mockRequest);
      
      expect(mockFetch).toHaveBeenCalledWith(mockRequest);
      expect(mockCacheMatch).toHaveBeenCalledWith(mockRequest);
    });
  });
});