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
	import { profileStore, currentUserProfile } from '$lib/stores/profileStore';
	import { cachedQuery, getCacheKey } from '$lib/utils/queryCache';
	import { lazyLoader, isAnchorWidget, isQuietWidget } from '$lib/utils/lazyLoader';
	import { loadQuietWidget, hasQuietLoader } from '$lib/utils/quietWidgetLoader';
	import { performanceTracker, trackSupabaseQuery } from '$lib/utils/performanceTracker';

	let widgets: WidgetConfig[] = $state([]);
	let loadedWidgets: { config: WidgetConfig, component: any }[] = $state([]);
	let loadedQuietWidgets: { config: WidgetConfig, component: any }[] = $state([]);
	let items: Database['public']['Tables']['items']['Row'][] = $state([]);
	let interactions: Database['public']['Tables']['interactions']['Row'][] = $state([]);
	let loading = $state(true);
	let quietWidgetsLoading = $state(false);
	let quietWidgetsLoaded = $state(false);
	let userName = $derived($user?.user_metadata?.full_name || $user?.email?.split('@')[0] || 'Friend');

	// Individual widget collapse states
	let widgetCollapseStates = $state<Record<string, boolean>>({});
	
	// Initialize widget collapse states
	function initializeWidgetStates(allWidgets: WidgetConfig[]) {
		const initialStates: Record<string, boolean> = {};
		allWidgets.forEach(widget => {
			// Default to expanded for anchor widgets, collapsed for others
			if (['reflectionMood', 'ayah', 'birthday', 'scenario', 'closingRitual'].includes(widget.id)) {
				initialStates[widget.id] = true;
			} else {
				initialStates[widget.id] = false;
			}
		});
		// Add quietMode state - starts collapsed
		initialStates['quietMode'] = false;
		widgetCollapseStates = initialStates;
	}
	
	// Use profileStore instead of local profiles state
	let profiles = $derived($profileStore);

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

	async function loadAnchorWidgets() {
		widgets = widgetRegistry.getSorted();
		
		// Filter only anchor widgets for immediate loading
		const anchorWidgets = widgets.filter(widget => isAnchorWidget(widget.id));
		
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

	async function loadQuietWidgets() {
		if (quietWidgetsLoaded || quietWidgetsLoading) {
			return;
		}

		quietWidgetsLoading = true;
		
		try {
			// Filter only quiet widgets for lazy loading
			const quietWidgets = widgets.filter(widget => isQuietWidget(widget.id));
			
			// Load components for quiet widgets using specialized loader
			const componentPromises = quietWidgets.map(async (widget) => {
				try {
					let component;
					
					// Use specialized quiet widget loader if available
					if (hasQuietLoader(widget.id)) {
						component = await loadQuietWidget(widget.id);
					} else {
						// Fallback to registry function
						const componentModule = await (widget.component as () => Promise<{default: any}>)();
						component = componentModule.default;
					}
					
					return { 
						config: widget, 
						component: component
					};
				} catch (error) {
					console.error(`Failed to load quiet widget ${widget.id}:`, error);
					return null;
				}
			});

			const results = await Promise.all(componentPromises);
			loadedQuietWidgets = results.filter(result => result !== null) as { config: WidgetConfig, component: any }[];
			quietWidgetsLoaded = true;
		} catch (error) {
			console.error('Error loading quiet widgets:', error);
		} finally {
			quietWidgetsLoading = false;
		}
	}

	// Enhanced toggle function to trigger lazy loading
	async function toggleWidget(widgetId: string) {
		// If toggling quiet mode and widgets aren't loaded yet, load them
		if (widgetId === 'quietMode' && !widgetCollapseStates[widgetId] && !quietWidgetsLoaded) {
			await loadQuietWidgets();
		}
		
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
	<!-- Header -->
	<header class="bg-white border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<HeartHandshake class="w-8 h-8 text-primary-600" aria-hidden="true" />
					<div>
						<h1 class="text-2xl font-bold text-gray-900">FamilyNest</h1>
						<p class="text-sm text-gray-600">Your family's sacred space</p>
					</div>
				</div>
				
				<div class="flex items-center gap-4">
					<div class="text-right">
						<p class="text-sm font-medium text-gray-900">
							🌿 Salam {userName}
						</p>
						<p class="text-xs text-gray-500">Welcome back</p>
					</div>
					
					{#if $currentUserProfile}
						{@const profile = $currentUserProfile}
						{#if profile && profile.avatar_url}
							<img
								src="{profile.avatar_url}?t={Date.now()}"
								alt={profile.display_name || 'User avatar'}
								class="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
							/>
						{:else}
							<div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
								{profile?.display_name?.charAt(0) || 'U'}
							</div>
						{/if}
					{:else}
						<div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
							<User class="w-6 h-6 text-gray-600" aria-hidden="true" />
						</div>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if loading}
			<Loading skeleton={true} skeletonCount={4} />
		{:else}
			<!-- ANCHOR WIDGETS - Maximum 3-4 visible at first load -->
			<div class="space-y-8 mb-12">
				<div class="text-center mb-8">
					<h2 class="text-xl font-semibold text-gray-900 mb-2">Today's Family Connection</h2>
					<p class="text-gray-600">Your daily anchors for staying close</p>
				</div>
				
				{#each loadedWidgets.filter(w => ['reflectionMood', 'ayah', 'birthday', 'quiz', 'scenario'].includes(w.config.id)) as { config: widget, component: Component } (widget.id)}
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

			<!-- QUIET MODE WIDGETS - Collapsed by default, shown in "Explore More" -->
			<div class="w-full max-w-4xl mx-auto">
				<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
					<button
						type="button"
						onclick={() => toggleWidget('quietMode')}
						class="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-gray-50 transition-colors"
						aria-expanded={widgetCollapseStates['quietMode']}
					>
						<div class="flex items-center gap-4">
							<span class="text-3xl">🔍</span>
							<div>
								<h3 class="text-lg font-semibold text-gray-900">Explore More</h3>
								<p class="text-sm text-gray-500">Additional activities, memories, and family insights</p>
							</div>
						</div>
						<ChevronDown 
							class="w-6 h-6 text-gray-400 transition-transform duration-300 ease-in-out {widgetCollapseStates['quietMode'] ? 'rotate-180' : ''}"
							aria-hidden="true"
						/>
					</button>
					
					{#if widgetCollapseStates['quietMode']}
						<div class="px-6 pb-6 border-t border-gray-100 bg-gray-50">
							{#if quietWidgetsLoading}
								<div class="flex items-center justify-center py-12">
									<div class="flex items-center gap-3">
										<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
										<p class="text-gray-600">Loading additional widgets...</p>
									</div>
								</div>
							{:else if quietWidgetsLoaded && loadedQuietWidgets.length > 0}
								<div class="grid grid-cols-1 @container md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
									{#each loadedQuietWidgets as { config: widget, component: Component } (widget.id)}
										<div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 animate-fade-in">
											<div class="flex items-center gap-2 mb-4">
												<h4 class="text-sm font-semibold text-gray-900">{widget.name}</h4>
											</div>
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
										</div>
									{/each}
								</div>
							{:else}
								<div class="text-center py-12">
									<Leaf class="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
									<p class="text-gray-500">No additional widgets available at this time.</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

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