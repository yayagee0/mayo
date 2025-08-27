<!--
  Example page showing how to use the AnalyticsDashboard component
  This demonstrates the comprehensive analytics functionality
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import AnalyticsDashboard from '$lib/../components/AnalyticsDashboard.svelte';
  import { session } from '$lib/stores/sessionStore';
  import { supabase } from '$lib/supabase';
  import { trackSupabaseQuery } from '$lib/utils/performanceTracker';
  import type { Database } from '$lib/supabase';

  let loading = $state(true);
  let profiles: Database['public']['Tables']['profiles']['Row'][] = $state([]);
  let items: Database['public']['Tables']['items']['Row'][] = $state([]);
  let interactions: Database['public']['Tables']['interactions']['Row'][] = $state([]);
  let reflections: Database['public']['Tables']['reflections']['Row'][] = $state([]);

  onMount(async () => {
    await loadData();
    loading = false;
  });

  async function loadData() {
    try {
      // Load profiles with performance tracking
      const profilesData = await trackSupabaseQuery('analytics-dashboard', 'load-profiles', async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
        
        if (error) throw error;
        return data || [];
      });

      // Load items with performance tracking
      const itemsData = await trackSupabaseQuery('analytics-dashboard', 'load-items', async () => {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      });

      // Load interactions with performance tracking
      const interactionsData = await trackSupabaseQuery('analytics-dashboard', 'load-interactions', async () => {
        const { data, error } = await supabase
          .from('interactions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      });

      // Load reflections with performance tracking
      const reflectionsData = await trackSupabaseQuery('analytics-dashboard', 'load-reflections', async () => {
        const { data, error } = await supabase
          .from('reflections')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      });

      profiles = profilesData;
      items = itemsData;
      interactions = interactionsData;
      reflections = reflectionsData;

    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  }
</script>

<svelte:head>
  <title>Family Analytics - Comprehensive Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <h1 class="text-xl font-semibold text-gray-900">Family Analytics</h1>
        <a href="/dashboard" class="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    {:else}
      <AnalyticsDashboard 
        session={$session}
        profiles={profiles}
        items={items}
        interactions={interactions}
        reflections={reflections}
      />
    {/if}
  </main>
</div>