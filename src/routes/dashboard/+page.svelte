<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { widgetRegistry } from '$lib/widgetRegistry';
	import type { WidgetConfig } from '$lib/types/widget';
	import type { Database } from '$lib/supabase';
	import { supabase } from '$lib/supabase';

	let widgets: WidgetConfig[] = [];
	let profiles: Database['public']['Tables']['profiles']['Row'][] = [];
	let items: Database['public']['Tables']['items']['Row'][] = [];
	let interactions: Database['public']['Tables']['interactions']['Row'][] = [];
	let loading = true;

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
			// Load profiles
			const { data: profilesData } = await supabase
				.from('profiles')
				.select('*')
				.order('created_at', { ascending: false });
			
			profiles = profilesData || [];

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
			<div class="flex justify-between items-center h-16">
				<h1 class="text-xl font-semibold text-gray-900">Dashboard</h1>
				<div class="flex items-center gap-4">
					<span class="text-sm text-gray-600">Welcome, {$user?.user_metadata?.full_name || $user?.email}</span>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if loading}
			<div class="flex justify-center items-center h-64">
				<div class="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each widgets as widget (widget.id)}
					<button
						type="button"
						class="transition-transform hover:scale-105 w-full"
						on:mouseenter={() => handleWidgetView(widget.id)}
						on:click={() => handleWidgetInteraction(widget.id)}
					>
						<svelte:component 
							this={widget.component} 
							session={$session}
							{profiles}
							{items}
							{interactions}
							{widget}
						/>
					</button>
				{/each}
			</div>

			{#if widgets.length === 0}
				<div class="text-center py-12">
					<p class="text-gray-500">No widgets available. Check your widget settings.</p>
				</div>
			{/if}
		{/if}
	</main>
</div>

