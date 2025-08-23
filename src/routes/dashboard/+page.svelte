<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { widgetRegistry } from '$lib/widgetRegistry';
	import type { WidgetConfig } from '$lib/types/widget';
	import type { Database } from '$lib/supabase';
	import { supabase } from '$lib/supabase';
	import { HeartHandshake } from 'lucide-svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import { profileStore } from '$lib/stores/profileStore';

	let widgets: WidgetConfig[] = $state([]);
	let items: Database['public']['Tables']['items']['Row'][] = $state([]);
	let interactions: Database['public']['Tables']['interactions']['Row'][] = $state([]);
	let loading = $state(true);
	let userName = $derived($user?.user_metadata?.full_name || $user?.email?.split('@')[0] || 'Friend');

	// Use profileStore instead of local profiles state
	let profiles = $derived($profileStore);

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

<div class="min-h-screen bg-gray-50 pb-20">
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="py-8 sm:py-12">
				<!-- Hero Section -->
				<div class="text-center space-y-4">
					<div class="flex items-center justify-center gap-3 mb-4">
						<HeartHandshake class="w-8 h-8 text-green-500" aria-hidden="true" />
						<h1 class="text-3xl sm:text-4xl lg:text-5xl font-display font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
							🌿 Salam {userName}, Welcome Back
						</h1>
					</div>
					<p class="text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
						Your family's space for memories & reflection
					</p>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 motion-safe:animate-fade-in">
		{#if loading}
			<Loading skeleton={true} skeletonCount={4} />
		{:else}
			<!-- Desktop layout: 2-column grid for lg+ screens -->
			<div class="hidden lg:block">
				<!-- Family Wall spans full width on desktop -->
				{#each widgets.filter(w => w.id === 'wall') as widget (widget.id)}
					{@const Component = widget.component}
					<div class="mb-8 col-span-2">
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
				
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<!-- Spiritual Section -->
					<div class="space-y-6">
						<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
							Spiritual
						</h2>
						
						<div class="space-y-4">
							{#each widgets.filter(w => ['ayah', 'prompt'].includes(w.id)) as widget (widget.id)}
								{@const Component = widget.component}
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
							{/each}
						</div>
					</div>
					
					<!-- Social Section -->
					<div class="space-y-6">
						<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<div class="w-2 h-2 bg-green-500 rounded-full"></div>
							Social
						</h2>
						
						<div class="space-y-4">
							{#each widgets.filter(w => ['birthday', 'feedback', 'howOld'].includes(w.id)) as widget (widget.id)}
								{@const Component = widget.component}
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
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Mobile and tablet layout: Original single/dual column -->
			<div class="lg:hidden">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					{#each widgets as widget (widget.id)}
						{@const Component = widget.component}
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
					{/each}
				</div>
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

