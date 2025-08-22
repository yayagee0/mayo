<script lang="ts">
	import '../app.css';
	import { session, user } from '$lib/stores/sessionStore';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import BottomNav from '$lib/../components/ui/BottomNav.svelte';

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
	{@render children?.()}
	
	{#if showBottomNav}
		<BottomNav />
	{/if}
</div>
