<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { widgetRegistry } from '$lib/widgetRegistry';
	import type { WidgetConfig } from '$lib/types/widget';
	import type { Database } from '$lib/supabase';
	import { supabase } from '$lib/supabase';
	import { HeartHandshake, Leaf, ChevronDown, User } from 'lucide-svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import TopBar from '$lib/../components/TopBar.svelte';
	import ExploreMoreSection from '$lib/../components/ExploreMoreSection.svelte';
	import { profileStore, currentUserProfile } from '$lib/stores/profileStore';
	import { cachedQuery, getCacheKey } from '$lib/utils/queryCache';
	import { lazyLoader, isAnchorWidget } from '$lib/utils/lazyLoader';
	import { performanceTracker, trackSupabaseQuery } from '$lib/utils/performanceTracker';
	import { getUserRole } from '$lib/utils/roles';

	let widgets: WidgetConfig[] = $state([]);
	let loadedWidgets: { config: WidgetConfig, component: any }[] = $state([]);
	let items: Database['public']['Tables']['items']['Row'][] = $state([]);
	let interactions: Database['public']['Tables']['interactions']['Row'][] = $state([]);
	let loading = $state(true);
	let userName = $derived($user?.user_metadata?.full_name || $user?.email?.split('@')[0] || 'Friend');

	// Individual widget collapse states
	let widgetCollapseStates = $state<Record<string, boolean>>({});
	
	// Initialize widget collapse states
	function initializeWidgetStates(allWidgets: WidgetConfig[]) {
		const initialStates: Record<string, boolean> = {};
		allWidgets.forEach(widget => {
			// Default to expanded for anchor widgets, collapsed for others
			if (['reflectionMood', 'ayah', 'birthday', 'wall', 'closingRitual'].includes(widget.id)) {
				initialStates[widget.id] = true;
			} else {
				initialStates[widget.id] = false;
			}
		});
		widgetCollapseStates = initialStates;
	}
	
	// Use profileStore instead of local profiles state
	let profiles = $derived($profileStore);

	// Get current user role for widget filtering
	let userRole = $derived(() => getUserRole($user?.email));

	// Get current user's profile for avatar - use imported currentUserProfile store instead
	// let currentUserProfile = $derived(() => {
	// 	if ($user?.email) {
	// 		return profiles.find(p => p.email === $user.email);
	// 	}
	// 	return null;
	// });

	function handleWidgetView(widgetId: string) {
		widgetRegistry.recordView(widgetId);
	}

	function handleWidgetInteraction(widgetId: string) {
		widgetRegistry.recordInteraction(widgetId);
	}

	// Filter widgets based on role-based visibility rules
	function shouldShowWidget(widgetId: string): boolean {
		const role = userRole();
		
		// Parent-only widgets
		if (['weeklyReflectionDigest', 'analytics', 'islamicReflectionDigest', 'scenarioDigest'].includes(widgetId)) {
			return role === 'parent';
		}
		
		// Children-only widgets  
		if (['islamicQA', 'scenario'].includes(widgetId)) {
			return role === 'child';
		}
		
		// All other widgets are visible to everyone
		return true;
	}

	async function loadAnchorWidgets() {
		widgets = widgetRegistry.getSorted();
		
		// Filter only anchor widgets for immediate loading, and apply role-based filtering
		const anchorWidgets = widgets.filter(widget => 
			isAnchorWidget(widget.id) && shouldShowWidget(widget.id)
		);
		
		// Load components for anchor widgets only
		const componentPromises = anchorWidgets.map(async (widget) => {
			try {
				// Widget component is a function that returns a promise with the component
				const componentModule = await (widget.component as () => Promise<{default: any}>)();
				return { 
					config: widget, 
					component: componentModule.default
				};
			} catch (error) {
				console.error(`Failed to load anchor widget ${widget.id}:`, error);
				return null;
			}
		});

		const results = await Promise.all(componentPromises);
		loadedWidgets = results.filter(result => result !== null) as { config: WidgetConfig, component: any }[];
		
		// Initialize widget states after loading
		initializeWidgetStates(widgets);
	}

	// Enhanced toggle function
	function toggleWidget(widgetId: string) {
		widgetCollapseStates[widgetId] = !widgetCollapseStates[widgetId];
	}

	async function loadData() {
		if (!$session?.user?.id) {
			goto('/');
			return;
		}

		try {
			loading = true;

			// Load items with caching and performance tracking
			const itemsCacheKey = getCacheKey('items', { order: 'created_at' });
			const itemsData = await cachedQuery(itemsCacheKey, async () => {
				return trackSupabaseQuery('dashboard', 'load-items', async () => {
					const { data, error } = await supabase
						.from('items')
						.select('*')
						.order('created_at', { ascending: false });
					
					if (error) throw error;
					return data || [];
				});
			});
			items = itemsData;

			// Load interactions with caching and performance tracking
			const interactionsCacheKey = getCacheKey('interactions', { order: 'created_at' });
			const interactionsData = await cachedQuery(interactionsCacheKey, async () => {
				return trackSupabaseQuery('dashboard', 'load-interactions', async () => {
					const { data, error } = await supabase
						.from('interactions')
						.select('*')
						.order('created_at', { ascending: false });
					
					if (error) throw error;
					return data || [];
				});
			});
			interactions = interactionsData;

			// Load anchor widgets immediately, lazy load quiet widgets
			await loadAnchorWidgets();

		} catch (error) {
			console.error('Error loading dashboard data:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
		
		// Log initial performance metrics after a short delay to capture bundle load
		setTimeout(() => {
			performanceTracker.logMetrics('Dashboard Loaded');
		}, 1000);
	});
</script>

<svelte:head>
	<title>Family Dashboard | FamilyNest</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
	<TopBar {userName} />
	<main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if loading}
			<Loading skeleton={true} skeletonCount={4} />
		{:else}
			<!-- ANCHOR WIDGETS - Always expanded, stacked vertically -->
			<div class="space-y-8 mb-12">
				<div class="text-center mb-8">
					<h2 class="text-xl font-semibold text-gray-900 mb-2">Today's Family Connection</h2>
					<p class="text-gray-600">Your daily anchors for staying close</p>
				</div>
				
				{#each loadedWidgets.filter(w => ['reflectionMood', 'ayah', 'birthday', 'wall'].includes(w.config.id)) as { config: widget, component: Component } (widget.id)}
					<div class="w-full max-w-2xl mx-auto">
						<button
							type="button"
							class="w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg transition-transform hover:scale-[1.02]"
							onmouseenter={() => handleWidgetView(widget.id)}
							onclick={() => handleWidgetInteraction(widget.id)}
							aria-label="View {widget.name} widget"
						>
							<Component 
								session={$session}
								{profiles}
								{items}
								{interactions}
								{widget}
							/>
						</button>
					</div>
				{/each}
			</div>

			<!-- CLOSING RITUAL - Always visible -->
			<div class="w-full max-w-2xl mx-auto mb-12">
				{#each loadedWidgets.filter(w => w.config.id === 'closingRitual') as { config: widget, component: Component } (widget.id)}
					<button
						type="button"
						class="w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
						onmouseenter={() => handleWidgetView(widget.id)}
						onclick={() => handleWidgetInteraction(widget.id)}
						aria-label="View {widget.name} widget"
					>
						<Component 
							session={$session}
							{profiles}
							{items}
							{interactions}
							{widget}
						/>
					</button>
				{/each}
			</div>

			<!-- EXPLORE MORE SECTION - Organized quiet widgets -->
			<ExploreMoreSection 
				{widgets}
				session={$session}
				{profiles}
				{items}
				{interactions}
				onWidgetView={handleWidgetView}
				onWidgetInteraction={handleWidgetInteraction}
				{userRole}
				widgetFilter={shouldShowWidget}
			/>

			{#if loadedWidgets.length === 0}
				<div class="text-center py-16">
					<Leaf class="w-20 h-20 text-gray-300 mx-auto mb-4" aria-hidden="true" />
					<h2 class="text-xl font-semibold text-gray-900 mb-2">No widgets available</h2>
					<p class="text-gray-500">Check your widget settings or reload the page.</p>
				</div>
			{/if}
		{/if}
	</main>
</div>