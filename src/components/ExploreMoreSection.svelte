<!--
  ExploreMoreSection Component - Organized quiet widgets in grouped accordions
  Replaces the inline "Explore More" section from dashboard
  Features responsive layout, accessibility, and lazy loading
-->
<script lang="ts">
	import { ChevronDown, Users, Gamepad2, BookOpen, Search } from 'lucide-svelte';
	import type { WidgetConfig } from '$lib/types/widget';
	import type { Database } from '$lib/supabase';
	import { isQuietWidget } from '$lib/utils/lazyLoader';
	import { loadQuietWidget, hasQuietLoader } from '$lib/utils/quietWidgetLoader';

	// Props using runes mode
	interface Props {
		widgets: WidgetConfig[];
		session: any;
		profiles: any;
		items: Database['public']['Tables']['items']['Row'][];
		interactions: Database['public']['Tables']['interactions']['Row'][];
		onWidgetView: (widgetId: string) => void;
		onWidgetInteraction: (widgetId: string) => void;
	}

	let { 
		widgets, 
		session, 
		profiles, 
		items, 
		interactions, 
		onWidgetView, 
		onWidgetInteraction 
	}: Props = $props();

	// Widget groupings based on requirements
	const widgetGroups = {
		familyDigests: {
			title: 'Family Digests',
			icon: Users,
			widgets: ['weeklyReflectionDigest', 'islamicReflectionDigest', 'scenarioDigest'],
			description: 'Family insights and reflections'
		},
		playFun: {
			title: 'Play & Fun',
			icon: Gamepad2,
			widgets: ['agePlayground', 'profileQuiz', 'professionCard'],
			description: 'Interactive activities and games'
		},
		faithLearning: {
			title: 'Faith & Learning',
			icon: BookOpen,
			widgets: ['islamicQA', 'analytics', 'wall'],
			description: 'Learning resources and archives'
		}
	};

	// State
	let isExpanded = $state(false);
	let quietWidgetsLoading = $state(false);
	let quietWidgetsLoaded = $state(false);
	let loadedQuietWidgets: { config: WidgetConfig, component: any }[] = $state([]);
	
	// Group collapse states - default collapsed on mobile, expanded on desktop
	let groupCollapseStates = $state({
		familyDigests: false,
		playFun: false,
		faithLearning: false
	});

	// Initialize group states based on screen size
	function initializeGroupStates() {
		const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
		groupCollapseStates = {
			familyDigests: isDesktop,
			playFun: isDesktop,
			faithLearning: isDesktop
		};
	}

	// Load quiet widgets when section is expanded
	async function loadQuietWidgets() {
		if (quietWidgetsLoaded || quietWidgetsLoading) return;
		
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

	// Toggle main section
	async function toggleSection() {
		if (!isExpanded && !quietWidgetsLoaded) {
			await loadQuietWidgets();
		}
		isExpanded = !isExpanded;
	}

	// Toggle individual groups
	function toggleGroup(groupKey: keyof typeof groupCollapseStates) {
		groupCollapseStates[groupKey] = !groupCollapseStates[groupKey];
	}

	// Get widgets for a specific group
	function getWidgetsForGroup(groupWidgets: string[]) {
		return loadedQuietWidgets.filter(w => groupWidgets.includes(w.config.id));
	}

	// Handle keyboard navigation
	function handleKeydown(event: KeyboardEvent, action: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		}
	}

	// Initialize on mount
	import { onMount } from 'svelte';
	onMount(() => {
		initializeGroupStates();
		
		// Listen for window resize to adjust group states
		const handleResize = () => initializeGroupStates();
		window.addEventListener('resize', handleResize);
		
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<!-- Explore More Section -->
<div class="w-full max-w-4xl mx-auto">
	<div class="bg-slate-50 rounded-2xl shadow-inner mt-6 p-4">
		
		<!-- Sticky Header -->
		<div class="sticky top-0 z-10 bg-slate-50 py-2 border-b border-slate-200 mb-4 rounded-t-2xl">
			<button
				type="button"
				onclick={toggleSection}
				onkeydown={(e) => handleKeydown(e, toggleSection)}
				class="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-slate-100 transition-colors rounded-lg"
				aria-expanded={isExpanded}
				style="min-height: 44px;"
			>
				<div class="flex items-center gap-3">
					<Search class="w-6 h-6 text-slate-600" aria-hidden="true" />
					<div>
						<h3 class="font-semibold text-slate-600">Explore More</h3>
						<p class="text-sm text-slate-500">Additional activities, memories, and family insights</p>
					</div>
				</div>
				<ChevronDown 
					class="w-6 h-6 text-slate-400 transition-transform duration-300 ease-in-out {isExpanded ? 'rotate-180' : ''}"
					aria-hidden="true"
				/>
			</button>
		</div>

		{#if isExpanded}
			<!-- Loading State -->
			{#if quietWidgetsLoading}
				<div class="flex items-center justify-center py-12">
					<div class="flex items-center gap-3">
						<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
						<p class="text-slate-600">Loading additional widgets...</p>
					</div>
				</div>
			
			<!-- Content with Widget Groups -->
			{:else if quietWidgetsLoaded && loadedQuietWidgets.length > 0}
				<div class="space-y-6">
					{#each Object.entries(widgetGroups) as [groupKey, group] (groupKey)}
						{@const groupWidgets = getWidgetsForGroup(group.widgets)}
						{@const IconComponent = group.icon}
						{#if groupWidgets.length > 0}
							<!-- Group Accordion -->
							<div class="bg-white rounded-xl shadow-sm border border-slate-200">
								<button
									type="button"
									onclick={() => toggleGroup(groupKey as keyof typeof groupCollapseStates)}
									onkeydown={(e) => handleKeydown(e, () => toggleGroup(groupKey as keyof typeof groupCollapseStates))}
									class="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-slate-50 transition-colors rounded-t-xl"
									aria-expanded={groupCollapseStates[groupKey as keyof typeof groupCollapseStates]}
									style="min-height: 44px;"
								>
									<div class="flex items-center gap-3">
										<IconComponent class="w-5 h-5 text-primary-600" aria-hidden="true" />
										<div>
											<h4 class="text-base font-medium text-slate-700">{group.title}</h4>
											<p class="text-sm text-slate-500">{group.description}</p>
										</div>
									</div>
									<ChevronDown 
										class="w-5 h-5 text-slate-400 transition-transform duration-300 ease-in-out {groupCollapseStates[groupKey as keyof typeof groupCollapseStates] ? 'rotate-180' : ''}"
										aria-hidden="true"
									/>
								</button>

								{#if groupCollapseStates[groupKey as keyof typeof groupCollapseStates]}
									<!-- Widget Grid for this group -->
									<div class="px-4 pb-4 border-t border-slate-100">
										<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
											{#each groupWidgets as { config: widget, component: Component } (widget.id)}
												<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all duration-200">
													<div class="flex items-center gap-2 mb-3">
														<h5 class="text-base font-medium text-slate-700">{widget.name}</h5>
													</div>
													<button
														type="button"
														class="w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
														onmouseenter={() => onWidgetView(widget.id)}
														onclick={() => onWidgetInteraction(widget.id)}
														aria-label="View {widget.name} widget"
													>
														<Component 
															{session}
															{profiles}
															{items}
															{interactions}
															{widget}
														/>
													</button>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			
			<!-- Empty State -->
			{:else}
				<div class="text-center py-12">
					<Search class="w-16 h-16 text-slate-300 mx-auto mb-4" aria-hidden="true" />
					<p class="text-slate-500">No additional widgets available at this time.</p>
				</div>
			{/if}
		{/if}
	</div>
</div>