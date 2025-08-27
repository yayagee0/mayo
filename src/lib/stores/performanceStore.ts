/**
 * Reactive Svelte store for performance metrics
 * Integrates with performanceTracker for real-time updates
 */

import { writable, derived } from 'svelte/store';
import { performanceTracker } from '$lib/utils/performanceTracker';

interface PerformanceMetrics {
  bundleLoadTime: number;
  supabaseQueries: Array<{
    widget: string;
    operation: string;
    duration: number;
    timestamp: number;
  }>;
  widgetRenderTimes: Array<{
    widget: string;
    duration: number;
    timestamp: number;
  }>;
  initialized: boolean;
}

interface PerformanceStats {
  avgQueryTime: number;
  avgRenderTime: number;
  slowestQuery: { widget: string; duration: number } | null;
  slowestRender: { widget: string; duration: number } | null;
  totalQueries: number;
  totalRenders: number;
}

// Create writable store for raw metrics
const performanceMetrics = writable<PerformanceMetrics>({
  bundleLoadTime: 0,
  supabaseQueries: [],
  widgetRenderTimes: [],
  initialized: false
});

// Derived store for computed statistics
export const performanceStats = derived(
  performanceMetrics,
  ($metrics): PerformanceStats => {
    const avgQueryTime = $metrics.supabaseQueries.length > 0
      ? $metrics.supabaseQueries.reduce((sum, q) => sum + q.duration, 0) / $metrics.supabaseQueries.length
      : 0;

    const avgRenderTime = $metrics.widgetRenderTimes.length > 0
      ? $metrics.widgetRenderTimes.reduce((sum, r) => sum + r.duration, 0) / $metrics.widgetRenderTimes.length
      : 0;

    const slowestQuery = $metrics.supabaseQueries.length > 0
      ? $metrics.supabaseQueries.reduce((max, q) => q.duration > max.duration ? q : max)
      : null;

    const slowestRender = $metrics.widgetRenderTimes.length > 0
      ? $metrics.widgetRenderTimes.reduce((max, r) => r.duration > max.duration ? r : max)
      : null;

    return {
      avgQueryTime,
      avgRenderTime,
      slowestQuery,
      slowestRender,
      totalQueries: $metrics.supabaseQueries.length,
      totalRenders: $metrics.widgetRenderTimes.length
    };
  }
);

// Function to update metrics from the performance tracker
export function updatePerformanceMetrics() {
  const trackerMetrics = performanceTracker.getMetrics();
  
  performanceMetrics.update(current => ({
    ...current,
    bundleLoadTime: trackerMetrics.bundleLoadTime,
    supabaseQueries: trackerMetrics.supabaseQueries,
    initialized: trackerMetrics.initialized
  }));
}

// Function to add widget render time
export function addWidgetRenderTime(widget: string, duration: number) {
  performanceMetrics.update(current => {
    const newRenderTimes = [...current.widgetRenderTimes, {
      widget,
      duration,
      timestamp: Date.now()
    }];

    // Keep only last 50 render times to prevent memory issues
    if (newRenderTimes.length > 50) {
      newRenderTimes.shift();
    }

    return {
      ...current,
      widgetRenderTimes: newRenderTimes
    };
  });
}

// Auto-update from performance tracker every 5 seconds when in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  setInterval(() => {
    updatePerformanceMetrics();
  }, 5000);
}

// Export the store for reading
export { performanceMetrics };