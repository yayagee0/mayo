<!--
  Performance Metrics View - Parent-only debug panel
  Shows runtime performance metrics from performanceTracker
  Lightweight monitoring for development and parent insights
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Clock, Zap, Activity, Database } from 'lucide-svelte';
  import { performanceMetrics, performanceStats, updatePerformanceMetrics } from '$lib/stores/performanceStore';
  import { getUserRole } from '$lib/utils/roles';
  import type { User } from '@supabase/supabase-js';

  interface Props {
    user: User | null;
  }

  let { user = null }: Props = $props();

  // Only show to parents
  let isParent = $derived(user?.email ? getUserRole(user.email as any) === 'parent' : false);

  let updateInterval: number;

  onMount(() => {
    // Initial load
    updatePerformanceMetrics();
    
    // Update every 3 seconds when component is visible
    updateInterval = window.setInterval(() => {
      updatePerformanceMetrics();
    }, 3000);
  });

  onDestroy(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });

  // Format duration for display
  function formatDuration(ms: number): string {
    if (ms < 1) return '<1ms';
    return `${ms.toFixed(1)}ms`;
  }

  // Format timestamp for display
  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  // Get recent queries (last 5)
  let recentQueries = $derived($performanceMetrics.supabaseQueries.slice(-5).reverse());
  let recentRenders = $derived($performanceMetrics.widgetRenderTimes.slice(-5).reverse());
</script>

{#if isParent}
  <div class="card">
    <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <Activity class="w-5 h-5 text-blue-600" />
      Performance Metrics
    </h2>
    
    <div class="text-sm text-gray-600 mb-6">
      Runtime performance tracking for development and debugging. Data refreshes automatically.
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <!-- Bundle Load Time -->
      <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <Zap class="w-4 h-4 text-white" />
        </div>
        <div class="text-lg font-bold text-gray-900">
          {formatDuration($performanceMetrics.bundleLoadTime)}
        </div>
        <div class="text-xs text-gray-600">Bundle Load</div>
      </div>

      <!-- Average Query Time -->
      <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
        <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <Database class="w-4 h-4 text-white" />
        </div>
        <div class="text-lg font-bold text-gray-900">
          {formatDuration($performanceStats.avgQueryTime)}
        </div>
        <div class="text-xs text-gray-600">Avg Query</div>
      </div>

      <!-- Average Render Time -->
      <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
        <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <Clock class="w-4 h-4 text-white" />
        </div>
        <div class="text-lg font-bold text-gray-900">
          {formatDuration($performanceStats.avgRenderTime)}
        </div>
        <div class="text-xs text-gray-600">Avg Render</div>
      </div>

      <!-- Total Operations -->
      <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
        <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <Activity class="w-4 h-4 text-white" />
        </div>
        <div class="text-lg font-bold text-gray-900">
          {$performanceStats.totalQueries + $performanceStats.totalRenders}
        </div>
        <div class="text-xs text-gray-600">Operations</div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Recent Queries -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Database class="w-4 h-4" />
          Recent Queries ({$performanceStats.totalQueries} total)
        </h3>
        
        {#if recentQueries.length === 0}
          <div class="text-sm text-gray-500 italic">No queries tracked yet</div>
        {:else}
          <div class="space-y-2">
            {#each recentQueries as query}
              <div class="flex justify-between items-center text-xs">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-700">{query.widget}</span>
                  <span class="text-gray-500">{query.operation}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-mono" class:text-red-600={query.duration > 1000} class:text-yellow-600={query.duration > 500}>
                    {formatDuration(query.duration)}
                  </span>
                  <span class="text-gray-400">{formatTime(query.timestamp)}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if $performanceStats.slowestQuery}
          <div class="mt-3 pt-3 border-t border-gray-200">
            <div class="text-xs text-gray-600">
              Slowest: <span class="font-medium">{$performanceStats.slowestQuery.widget}</span>
              (<span class="font-mono text-red-600">{formatDuration($performanceStats.slowestQuery.duration)}</span>)
            </div>
          </div>
        {/if}
      </div>

      <!-- Recent Renders -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Clock class="w-4 h-4" />
          Recent Renders ({$performanceStats.totalRenders} total)
        </h3>
        
        {#if recentRenders.length === 0}
          <div class="text-sm text-gray-500 italic">No renders tracked yet</div>
        {:else}
          <div class="space-y-2">
            {#each recentRenders as render}
              <div class="flex justify-between items-center text-xs">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-700">{render.widget}</span>
                  <span class="text-gray-500">render</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-mono" class:text-red-600={render.duration > 100} class:text-yellow-600={render.duration > 50}>
                    {formatDuration(render.duration)}
                  </span>
                  <span class="text-gray-400">{formatTime(render.timestamp)}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if $performanceStats.slowestRender}
          <div class="mt-3 pt-3 border-t border-gray-200">
            <div class="text-xs text-gray-600">
              Slowest: <span class="font-medium">{$performanceStats.slowestRender.widget}</span>
              (<span class="font-mono text-red-600">{formatDuration($performanceStats.slowestRender.duration)}</span>)
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Development Notice -->
    {#if import.meta.env.DEV}
      <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-start">
          <div class="text-blue-600 mr-2 mt-0.5">ℹ️</div>
          <div class="text-sm text-blue-800">
            <strong>Development Mode:</strong> Performance metrics are being logged to browser console. 
            Check browser dev tools for detailed logs.
          </div>
        </div>
      </div>
    {:else}
      <div class="mt-4 text-xs text-gray-500 text-center">
        💡 Performance tracking is lightweight and does not impact app performance
      </div>
    {/if}
  </div>
{/if}