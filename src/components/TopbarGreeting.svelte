<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { profileStore } from '$lib/stores/profileStore';
	import type { Profile } from '$lib/stores/profileStore';

	interface Props {
		profile?: Profile | null;
	}
	
	let { profile }: Props = $props();
	
	let displayName = $derived(profile?.display_name || profile?.email?.split('@')[0] || 'User');
	let recentAuthor = $state<string | null>(null);
	let isLoading = $state(true);

	async function fetchLatestPost() {
		try {
			const { data, error } = await supabase
				.from('items')
				.select('author_email, created_at')
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle();

			if (error) {
				console.error('Error fetching latest post:', error);
				return;
			}

			if (data && data.author_email !== profile?.email) {
				// Map email to display name
				const authorProfile = profileStore.findByEmail(data.author_email);
				recentAuthor = authorProfile?.display_name || data.author_email.split('@')[0];
			}
		} catch (err) {
			console.error('Error fetching latest post:', err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchLatestPost();
	});

	let secondaryMessage = $derived(() => {
		if (isLoading) return "Loading...";
		if (recentAuthor) return `${recentAuthor} posted something today 💌`;
		return "Good to see you, family is waiting ❤️";
	});
</script>

<div class="hidden md:block bg-white border-b border-gray-200/50 animate-fade-in">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
		<div class="space-y-1">
			<h2 class="text-lg font-semibold text-gray-900">
				Welcome back, {displayName} 🙏
			</h2>
			<p class="text-sm text-gray-500">
				{secondaryMessage}
			</p>
		</div>
	</div>
</div>