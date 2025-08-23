<script lang="ts">
	import '../app.css';
	import { session, user } from '$lib/stores/sessionStore';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import BottomNav from '$lib/../components/ui/BottomNav.svelte';
	import TopNav from '$lib/../components/ui/TopNav.svelte';
	import PostComposer from '$lib/../components/PostComposer.svelte';

	let { children } = $props();

	// Allowed emails for access control
	const ALLOWED_EMAILS = [
		'nilezat@gmail.com',
		'abdessamia.mariem@gmail.com',
		'yazidgeemail@gmail.com',
		'yahyageemail@gmail.com'
	];

	let isAuthenticated = $derived($session !== null);
	let userEmail = $derived($user?.email);
	let isAllowedUser = $derived(userEmail && ALLOWED_EMAILS.includes(userEmail));
	let showBottomNav = $derived(isAuthenticated && isAllowedUser && !$page.url.pathname.includes('access-denied'));
	let showTopNav = $derived(isAuthenticated && isAllowedUser && !$page.url.pathname.includes('access-denied'));

	// PostComposer modal state
	let showComposer = $state(false);

	function handleComposerOpen() {
		showComposer = true;
	}

	function handleComposerClose() {
		showComposer = false;
	}

	onMount(() => {
		// Check if user is authenticated but not allowed
		if (isAuthenticated && userEmail && !isAllowedUser) {
			window.location.href = '/access-denied';
		}
	});
</script>

<svelte:head>
	<title>Mayo - Family Engagement App</title>
	<meta name="description" content="A family engagement platform for sharing, connecting, and growing together." />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Top Navigation for Desktop -->
	{#if showTopNav}
		<div class="hidden lg:block">
			<TopNav />
		</div>
	{/if}
	
	{@render children?.()}
	
	<!-- Bottom Navigation for Mobile and Tablet -->
	{#if showBottomNav}
		<div class="lg:hidden">
			<BottomNav onComposerOpen={handleComposerOpen} />
		</div>
	{/if}
	
	<!-- PostComposer Modal -->
	{#if showComposer}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<div class="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
				<PostComposer 
					onPostCreated={handleComposerClose}
					onCancel={handleComposerClose}
					placeholder="What's on your mind? Share something meaningful..."
				/>
			</div>
		</div>
	{/if}
</div>
