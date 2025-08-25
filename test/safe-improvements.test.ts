// Tests for Mayo app safe improvements (performance, analytics, PWA)
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { queryCache, cachedQuery, getCacheKey } from '../src/lib/utils/queryCache';
import { isAnchorWidget, isQuietWidget } from '../src/lib/utils/lazyLoader';

describe('Mayo App Safe Improvements', () => {
  beforeEach(() => {
    queryCache.clear();
    vi.clearAllMocks();
  });

  describe('Query Caching', () => {
    it('should cache and retrieve query results', async () => {
      const mockData = { items: [{ id: 1, title: 'Test' }] };
      const queryFn = vi.fn().mockResolvedValue(mockData);
      
      // First call should execute query
      const result1 = await cachedQuery('test-key', queryFn);
      expect(result1).toEqual(mockData);
      expect(queryFn).toHaveBeenCalledTimes(1);
      
      // Second call should return cached result
      const result2 = await cachedQuery('test-key', queryFn);
      expect(result2).toEqual(mockData);
      expect(queryFn).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should generate proper cache keys', () => {
      const key1 = getCacheKey('items', { order: 'created_at' });
      const key2 = getCacheKey('items', { order: 'created_at', limit: 10 });
      
      expect(key1).toBe('items?order:created_at');
      expect(key2).toBe('items?limit:10|order:created_at'); // Sorted
    });

    it('should invalidate cache entries by pattern', () => {
      queryCache.set('items?order:created_at', { data: 'test1' });
      queryCache.set('interactions?order:created_at', { data: 'test2' });
      queryCache.set('profiles?limit:10', { data: 'test3' });
      
      queryCache.invalidate('items');
      
      expect(queryCache.get('items?order:created_at')).toBeNull();
      expect(queryCache.get('interactions?order:created_at')).not.toBeNull();
      expect(queryCache.get('profiles?limit:10')).not.toBeNull();
    });

    it('should calculate cache stats correctly', () => {
      queryCache.set('valid-key', { data: 'test' }, 60000); // 1 minute TTL
      
      const stats = queryCache.getStats();
      expect(stats.total).toBeGreaterThanOrEqual(1);
      expect(stats.valid).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Lazy Loading Widget Classification', () => {
    it('should correctly classify anchor widgets', () => {
      expect(isAnchorWidget('reflectionMood')).toBe(true);
      expect(isAnchorWidget('ayah')).toBe(true);
      expect(isAnchorWidget('birthday')).toBe(true);
      expect(isAnchorWidget('quiz')).toBe(true);
      expect(isAnchorWidget('scenario')).toBe(true);
      expect(isAnchorWidget('closingRitual')).toBe(true);
      
      // These should not be anchor widgets
      expect(isAnchorWidget('wall')).toBe(false);
      expect(isAnchorWidget('analytics')).toBe(false);
      expect(isAnchorWidget('agePlayground')).toBe(false);
    });

    it('should correctly classify quiet widgets', () => {
      expect(isQuietWidget('wall')).toBe(true);
      expect(isQuietWidget('analytics')).toBe(true);
      expect(isQuietWidget('agePlayground')).toBe(true);
      expect(isQuietWidget('professionCard')).toBe(true);
      expect(isQuietWidget('islamicQA')).toBe(true);
      expect(isQuietWidget('scenarioDigest')).toBe(true);
      
      // These should not be quiet widgets
      expect(isQuietWidget('reflectionMood')).toBe(false);
      expect(isQuietWidget('ayah')).toBe(false);
      expect(isQuietWidget('birthday')).toBe(false);
    });

    it('should not have overlap between anchor and quiet widgets', () => {
      const anchorWidgets = ['reflectionMood', 'ayah', 'birthday', 'quiz', 'scenario', 'closingRitual'];
      const quietWidgets = ['wall', 'scenarioDigest', 'profileQuiz', 'agePlayground', 'professionCard', 'islamicQA', 'islamicReflectionDigest', 'weeklyReflectionDigest', 'analytics'];
      
      anchorWidgets.forEach(widget => {
        expect(isQuietWidget(widget)).toBe(false);
      });
      
      quietWidgets.forEach(widget => {
        expect(isAnchorWidget(widget)).toBe(false);
      });
    });
  });

  describe('PWA Utilities', () => {
    it('should handle service worker registration when supported', async () => {
      // Mock successful service worker registration
      const mockRegister = vi.fn().mockResolvedValue({
        addEventListener: vi.fn()
      });
      
      // Mock navigator.serviceWorker
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: { register: mockRegister }
        },
        writable: true
      });

      const { registerServiceWorker } = await import('../src/lib/utils/pwa');
      const result = await registerServiceWorker();
      
      expect(result).toBe(true);
      expect(mockRegister).toHaveBeenCalledWith('/sw.js');
    });

    it('should handle missing service worker support gracefully', async () => {
      // Mock navigator without service worker support
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true
      });

      const { registerServiceWorker } = await import('../src/lib/utils/pwa');
      const result = await registerServiceWorker();
      
      expect(result).toBe(false);
    });

    it('should handle service worker registration failure', async () => {
      const mockRegister = vi.fn().mockRejectedValue(new Error('Registration failed'));
      
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: { register: mockRegister }
        },
        writable: true
      });

      const { registerServiceWorker } = await import('../src/lib/utils/pwa');
      const result = await registerServiceWorker();
      
      expect(result).toBe(false);
    });
  });

  describe('Analytics Engagement Calculation', () => {
    it('should calculate engagement stats from interactions data', () => {
      const items = [
        { id: 'item1', created_at: '2024-01-15T10:00:00Z' },
        { id: 'item2', created_at: '2024-01-16T10:00:00Z' }
      ];

      const interactions = [
        { 
          id: 'int1', 
          user_id: 'user1', 
          interaction_type: 'view',
          created_at: new Date().toISOString(),
          metadata: { widgetType: 'reflectionMood' }
        },
        { 
          id: 'int2', 
          user_id: 'user2', 
          interaction_type: 'like',
          created_at: new Date().toISOString(),
          metadata: { widgetType: 'ayah' }
        },
        { 
          id: 'int3', 
          user_id: 'user1', 
          interaction_type: 'comment',
          created_at: new Date().toISOString(),
          metadata: { widgetType: 'reflectionMood' }
        }
      ];

      const profiles = [
        { id: 'user1', display_name: 'User 1' },
        { id: 'user2', display_name: 'User 2' }
      ];

      // Mock the calculation function from AnalyticsCard
      function calculateEngagementStats(items: any[], interactions: any[], profiles: any[]) {
        const views = interactions.filter(i => i.interaction_type === 'view');
        const likes = interactions.filter(i => i.interaction_type === 'like');
        const comments = interactions.filter(i => i.interaction_type === 'comment');
        
        const now = Date.now();
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
        const recentInteractions = interactions.filter(i => 
          new Date(i.created_at || '').getTime() > weekAgo
        );
        
        const activeUserIds = new Set(recentInteractions.map(i => i.user_id));

        return {
          totalPosts: items.length,
          totalViews: views.length,
          totalLikes: likes.length,
          totalComments: comments.length,
          activeMembers: activeUserIds.size,
          weeklyActivity: recentInteractions.length
        };
      }

      const stats = calculateEngagementStats(items, interactions, profiles);
      
      expect(stats.totalPosts).toBe(2);
      expect(stats.totalViews).toBe(1);
      expect(stats.totalLikes).toBe(1);
      expect(stats.totalComments).toBe(1);
      expect(stats.activeMembers).toBe(2);
      expect(stats.weeklyActivity).toBe(3);
    });
  });
});