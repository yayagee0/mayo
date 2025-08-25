/**
 * Lightweight runtime performance tracker for Mayo FamilyNest
 * Logs initial bundle load time and Supabase query duration per widget
 * Stores logs in browser console only (no external telemetry)
 */

interface PerformanceMetrics {
  bundleLoadTime: number;
  supabaseQueries: Array<{
    widget: string;
    operation: string;
    duration: number;
    timestamp: number;
  }>;
  initialized: boolean;
}

class PerformanceTracker {
  private metrics: PerformanceMetrics = {
    bundleLoadTime: 0,
    supabaseQueries: [],
    initialized: false
  };

  private startTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    try {
      this.startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      
      // Track bundle load completion
      if (typeof document !== 'undefined') {
        if (document.readyState === 'complete') {
          this.recordBundleLoadTime();
        } else {
          window.addEventListener('load', () => this.recordBundleLoadTime());
        }
      }

      this.metrics.initialized = true;
    } catch (error) {
      // Silently fail to avoid breaking the app
      console.debug('Performance tracker initialization failed:', error);
    }
  }

  private recordBundleLoadTime(): void {
    try {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      this.metrics.bundleLoadTime = now - this.startTime;
      this.logMetrics('Bundle Load Complete');
    } catch (error) {
      // Silently fail
      console.debug('Failed to record bundle load time:', error);
    }
  }

  /**
   * Track Supabase query duration for a specific widget
   */
  trackSupabaseQuery(widget: string, operation: string, startTime: number): void {
    try {
      let duration = 0;
      try {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        duration = now - startTime;
      } catch {
        // Fallback to 0 duration if performance API fails
        duration = 0;
      }
      
      this.metrics.supabaseQueries.push({
        widget,
        operation,
        duration,
        timestamp: Date.now()
      });

      // Keep only last 50 queries to prevent memory issues
      if (this.metrics.supabaseQueries.length > 50) {
        this.metrics.supabaseQueries.shift();
      }

      console.debug(`[${widget}] ${operation}: ${duration.toFixed(2)}ms`);
    } catch (error) {
      // Silently fail
      console.debug('Failed to track Supabase query:', error);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Log current metrics to console
   */
  logMetrics(context?: string): void {
    try {
      const prefix = context ? `[${context}] ` : '';
      
      console.log(`${prefix}Performance Metrics:`, {
        bundleLoadTime: `${this.metrics.bundleLoadTime.toFixed(2)}ms`,
        totalQueries: this.metrics.supabaseQueries.length,
        avgQueryTime: this.getAverageQueryTime(),
        recentQueries: this.metrics.supabaseQueries.slice(-5)
      });
    } catch (error) {
      // Silently fail
      console.debug('Failed to log metrics:', error);
    }
  }

  private getAverageQueryTime(): string {
    if (this.metrics.supabaseQueries.length === 0) return '0ms';
    
    const total = this.metrics.supabaseQueries.reduce((sum, query) => sum + query.duration, 0);
    const average = total / this.metrics.supabaseQueries.length;
    return `${average.toFixed(2)}ms`;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.metrics = {
      bundleLoadTime: 0,
      supabaseQueries: [],
      initialized: false
    };
    
    try {
      this.startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    } catch (error) {
      this.startTime = Date.now();
    }
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker();

// Helper function to wrap Supabase queries
export function trackSupabaseQuery<T>(
  widget: string, 
  operation: string, 
  queryFn: () => Promise<T>
): Promise<T> {
  let startTime: number;
  try {
    startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  } catch {
    startTime = Date.now();
  }
  
  return queryFn().finally(() => {
    try {
      performanceTracker.trackSupabaseQuery(widget, operation, startTime);
    } catch (error) {
      // Silently fail to avoid breaking the app
      console.debug('Failed to track query performance:', error);
    }
  });
}