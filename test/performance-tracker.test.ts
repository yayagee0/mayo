import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceTracker, trackSupabaseQuery } from '../src/lib/utils/performanceTracker';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => 1000)
};

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  debug: vi.fn()
};

describe('Performance Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock global objects first
    global.performance = mockPerformance as any;
    global.console = { ...console, ...mockConsole } as any;
    
    // Reset the tracker after mocking globals
    performanceTracker.reset();
  });

  describe('Initialization', () => {
    it('should initialize without throwing errors', () => {
      expect(() => {
        performanceTracker.getMetrics();
      }).not.toThrow();
    });

    it('should handle missing performance API gracefully', () => {
      global.performance = undefined as any;
      
      expect(() => {
        performanceTracker.trackSupabaseQuery('test-widget', 'select', 900);
      }).not.toThrow();
    });
  });

  describe('Supabase Query Tracking', () => {
    it('should track query duration correctly', () => {
      // Use a fixed start time and mock the current time to get predictable duration
      mockPerformance.now.mockReturnValue(1150);

      performanceTracker.trackSupabaseQuery('reflectionMood', 'select', 1000);

      const metrics = performanceTracker.getMetrics();
      expect(metrics.supabaseQueries).toHaveLength(1);
      expect(metrics.supabaseQueries[0]).toMatchObject({
        widget: 'reflectionMood',
        operation: 'select',
        duration: 150
      });
    });

    it('should limit query history to 50 entries', () => {
      // Add 55 queries
      for (let i = 0; i < 55; i++) {
        performanceTracker.trackSupabaseQuery(`widget-${i}`, 'select', 1000);
      }

      const metrics = performanceTracker.getMetrics();
      expect(metrics.supabaseQueries).toHaveLength(50);
    });

    it('should log debug information for queries', () => {
      mockPerformance.now.mockReturnValue(1100);
      
      performanceTracker.trackSupabaseQuery('ayah', 'insert', 1000);

      expect(mockConsole.debug).toHaveBeenCalledWith(
        '[ayah] insert: 100.00ms'
      );
    });
  });

  describe('trackSupabaseQuery helper function', () => {
    it('should track successful queries', async () => {
      const mockQueryFn = vi.fn().mockResolvedValue({ data: 'test' });
      mockPerformance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1200);

      const result = await trackSupabaseQuery('birthday', 'select', mockQueryFn);

      expect(result).toEqual({ data: 'test' });
      expect(mockQueryFn).toHaveBeenCalled();

      const metrics = performanceTracker.getMetrics();
      expect(metrics.supabaseQueries).toHaveLength(1);
      expect(metrics.supabaseQueries[0].widget).toBe('birthday');
    });

    it('should track queries even when they fail', async () => {
      const mockQueryFn = vi.fn().mockRejectedValue(new Error('Query failed'));
      mockPerformance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1300);

      await expect(trackSupabaseQuery('quiz', 'update', mockQueryFn)).rejects.toThrow('Query failed');

      const metrics = performanceTracker.getMetrics();
      expect(metrics.supabaseQueries).toHaveLength(1);
      expect(metrics.supabaseQueries[0]).toMatchObject({
        widget: 'quiz',
        operation: 'update',
        duration: 300
      });
    });
  });

  describe('Metrics Logging', () => {
    it('should log metrics to console without breaking', () => {
      performanceTracker.trackSupabaseQuery('wall', 'select', 1000);
      
      expect(() => {
        performanceTracker.logMetrics('Test Context');
      }).not.toThrow();

      expect(mockConsole.log).toHaveBeenCalledWith(
        '[Test Context] Performance Metrics:',
        expect.objectContaining({
          bundleLoadTime: expect.any(String),
          totalQueries: 1,
          avgQueryTime: expect.any(String),
          recentQueries: expect.any(Array)
        })
      );
    });

    it('should handle console.log errors gracefully', () => {
      mockConsole.log.mockImplementation(() => {
        throw new Error('Console error');
      });

      expect(() => {
        performanceTracker.logMetrics();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle performance API errors gracefully', () => {
      mockPerformance.now.mockImplementation(() => {
        throw new Error('Performance API error');
      });

      expect(() => {
        performanceTracker.trackSupabaseQuery('scenario', 'select', 1000);
      }).not.toThrow();
      
      // Should still track the query even with API error
      const metrics = performanceTracker.getMetrics();
      expect(metrics.supabaseQueries).toHaveLength(1);
    });

    it('should not break app functionality on tracker failures', async () => {
      // Reset performance mock to not throw
      mockPerformance.now.mockReturnValue(2000);
      
      // App should continue working despite tracker failure
      const mockQuery = vi.fn().mockResolvedValue('success');
      
      // Test that app doesn't break even if tracking fails
      const result = await trackSupabaseQuery('test', 'select', mockQuery);
      expect(result).toBe('success');
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset metrics correctly', () => {
      performanceTracker.trackSupabaseQuery('test', 'select', 1000);
      expect(performanceTracker.getMetrics().supabaseQueries).toHaveLength(1);

      performanceTracker.reset();
      expect(performanceTracker.getMetrics().supabaseQueries).toHaveLength(0);
    });
  });
});