<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user } from '$lib/stores/sessionStore';
	import { profileStore } from '$lib/stores/profileStore';
	import { goto } from '$app/navigation';
	import { widgetRegistry } from '$lib/widgetRegistry';
	import type { WidgetConfig } from '$lib/types/widget';
	import type { Database } from '$lib/supabase';
	import { supabase } from '$lib/supabase';
	import { Leaf } from 'lucide-svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import ErrorBoundary from '$lib/../components/ui/ErrorBoundary.svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';

	let widgets: WidgetConfig[] = $state([]);
	let items: Database['public']['Tables']['items']['Row'][] = $state([]);
	let interactions: Database['public']['Tables']['interactions']['Row'][] = $state([]);
	let loading = $state(true);
	let userName = $derived($user?.user_metadata?.full_name || $user?.email?.split('@')[0] || 'Friend');

	// Use the shared profile store - no need to transform, just pass the store value
	let profiles = $profileStore;

	onMount(async () => {
		// Redirect if not authenticated
		if (!$session) {
			goto('/');
			return;
		}

		// Load widgets
		widgets = widgetRegistry.getSorted();

		// Load data for widgets
		await loadData();
		loading = false;
	});

	async function loadData() {
		try {
			// Load recent items
			const { data: itemsData } = await supabase
				.from('items')
				.select('*')
				.eq('is_deleted', false)
				.order('created_at', { ascending: false })
				.limit(50);
			
			items = itemsData || [];

			// Load interactions
			const userEmail = $user?.email;
			if (userEmail) {
				const { data: interactionsData } = await supabase
					.from('interactions')
					.select('*')
					.eq('user_email', userEmail);
				
				interactions = interactionsData || [];
			}
		} catch (error) {
			console.error('Error loading dashboard data:', error);
		}
	}

	function handleWidgetView(widgetId: string) {
		widgetRegistry.recordView(widgetId);
	}

	function handleWidgetInteraction(widgetId: string) {
		widgetRegistry.recordInteraction(widgetId);
	}
</script>

<svelte:head>
	<title>Dashboard - Mayo</title>
</svelte:head>

<ErrorBoundary fallback={true} showDetails={false}>
	{#snippet children()}
		<div class="min-h-screen bg-gray-50 pb-20">
			<header class="bg-white shadow-sm border-b">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div class="flex justify-between items-center h-16">
						<div class="flex items-center gap-3">
							<Leaf class="w-6 h-6 text-green-500" aria-hidden="true" />
							<div>
								<h1 class="text-xl font-semibold text-gray-900">
									Salam {userName}, here's today's verse
								</h1>
								<p class="text-sm text-gray-600">Your family dashboard</p>
							</div>
						</div>
					</div>
				</div>
			</header>

			<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{#if loading}
					<Loading skeleton={true} skeletonCount={4} />
				{:else}
					<!-- SmartCards First - Always show these before any posts -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each widgets as widget (widget.id)}
							{@const Component = widget.component}
							<ComponentErrorBoundary componentName={widget.name}>
								{#snippet children()}
									<button
										type="button"
										class="transition-transform hover:scale-105 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
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
								{/snippet}
							</ComponentErrorBoundary>
						{/each}
					</div>

					{#if widgets.length === 0}
						<div class="text-center py-12">
							<Leaf class="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
							<h2 class="text-xl font-semibold text-gray-900 mb-2">No SmartCards available</h2>
							<p class="text-gray-500">Check your widget settings or reload the page.</p>
						</div>
					{/if}
				{/if}
			</main>
		</div>
	{/snippet}
</ErrorBoundary>

