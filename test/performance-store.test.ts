import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { performanceMetrics, performanceStats, updatePerformanceMetrics, addWidgetRenderTime } from '../src/lib/stores/performanceStore';
import { performanceTracker } from '../src/lib/utils/performanceTracker';

// Mock the performance tracker
vi.mock('../src/lib/utils/performanceTracker', () => ({
  performanceTracker: {
    getMetrics: vi.fn(),
    reset: vi.fn()
  }
}));

const mockPerformanceTracker = vi.mocked(performanceTracker);

describe('Performance Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset store to initial state
    performanceMetrics.set({
      bundleLoadTime: 0,
      supabaseQueries: [],
      widgetRenderTimes: [],
      initialized: false
    });
  });

  describe('Performance Metrics Store', () => {
    it('should have initial empty state', () => {
      const metrics = get(performanceMetrics);
      
      expect(metrics).toEqual({
        bundleLoadTime: 0,
        supabaseQueries: [],
        widgetRenderTimes: [],
        initialized: false
      });
    });

    it('should update from performance tracker', () => {
      const mockMetrics = {
        bundleLoadTime: 1500,
        supabaseQueries: [
          { widget: 'test', operation: 'select', duration: 100, timestamp: Date.now() }
        ],
        initialized: true
      };

      mockPerformanceTracker.getMetrics.mockReturnValue(mockMetrics);
      
      updatePerformanceMetrics();
      
      const metrics = get(performanceMetrics);
      expect(metrics.bundleLoadTime).toBe(1500);
      expect(metrics.supabaseQueries).toHaveLength(1);
      expect(metrics.initialized).toBe(true);
    });

    it('should add widget render times', () => {
      addWidgetRenderTime('testWidget', 50);
      
      const metrics = get(performanceMetrics);
      expect(metrics.widgetRenderTimes).toHaveLength(1);
      expect(metrics.widgetRenderTimes[0]).toMatchObject({
        widget: 'testWidget',
        duration: 50
      });
    });

    it('should limit render times to 50 entries', () => {
      // Add 55 render times
      for (let i = 0; i < 55; i++) {
        addWidgetRenderTime(`widget-${i}`, i * 10);
      }
      
      const metrics = get(performanceMetrics);
      expect(metrics.widgetRenderTimes).toHaveLength(50);
      
      // Should have the most recent entries
      expect(metrics.widgetRenderTimes[0].widget).toBe('widget-5');
      expect(metrics.widgetRenderTimes[49].widget).toBe('widget-54');
    });
  });

  describe('Performance Stats Derived Store', () => {
    it('should calculate correct statistics for empty data', () => {
      const stats = get(performanceStats);
      
      expect(stats).toEqual({
        avgQueryTime: 0,
        avgRenderTime: 0,
        slowestQuery: null,
        slowestRender: null,
        totalQueries: 0,
        totalRenders: 0
      });
    });

    it('should calculate correct statistics with data', () => {
      // Add some test data
      performanceMetrics.set({
        bundleLoadTime: 1000,
        supabaseQueries: [
          { widget: 'widget1', operation: 'select', duration: 100, timestamp: Date.now() },
          { widget: 'widget2', operation: 'insert', duration: 200, timestamp: Date.now() }
        ],
        widgetRenderTimes: [
          { widget: 'widget1', duration: 50, timestamp: Date.now() },
          { widget: 'widget2', duration: 75, timestamp: Date.now() }
        ],
        initialized: true
      });
      
      const stats = get(performanceStats);
      
      expect(stats.avgQueryTime).toBe(150); // (100 + 200) / 2
      expect(stats.avgRenderTime).toBe(62.5); // (50 + 75) / 2
      expect(stats.slowestQuery).toMatchObject({ widget: 'widget2', duration: 200 });
      expect(stats.slowestRender).toMatchObject({ widget: 'widget2', duration: 75 });
      expect(stats.totalQueries).toBe(2);
      expect(stats.totalRenders).toBe(2);
    });

    it('should handle single data points correctly', () => {
      performanceMetrics.set({
        bundleLoadTime: 1000,
        supabaseQueries: [
          { widget: 'singleWidget', operation: 'select', duration: 123, timestamp: Date.now() }
        ],
        widgetRenderTimes: [
          { widget: 'singleWidget', duration: 45, timestamp: Date.now() }
        ],
        initialized: true
      });
      
      const stats = get(performanceStats);
      
      expect(stats.avgQueryTime).toBe(123);
      expect(stats.avgRenderTime).toBe(45);
      expect(stats.slowestQuery?.widget).toBe('singleWidget');
      expect(stats.slowestRender?.widget).toBe('singleWidget');
    });
  });

  describe('Auto-update functionality', () => {
    it('should not throw errors when auto-update runs', () => {
      mockPerformanceTracker.getMetrics.mockReturnValue({
        bundleLoadTime: 2000,
        supabaseQueries: [],
        initialized: true
      });

      expect(() => {
        updatePerformanceMetrics();
      }).not.toThrow();
    });
  });
});