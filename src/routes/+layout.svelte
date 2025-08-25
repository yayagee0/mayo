<script lang="ts">
	import '../app.css';
	import { session, user } from '$lib/stores/sessionStore';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import BottomNav from '$lib/../components/ui/BottomNav.svelte';
	import Sidebar from '$lib/../components/ui/Sidebar.svelte';
	import PostComposer from '$lib/../components/PostComposer.svelte';
	import PWAInstallPrompt from '$lib/../components/ui/PWAInstallPrompt.svelte';
	import TopbarGreeting from '$lib/../components/TopbarGreeting.svelte';
	import { handleServiceWorker } from '$lib/pwa';
	import { env } from '$env/dynamic/public';
	import { currentUserProfile, resolveAvatar } from '$lib/stores/profileStore';
	import { getDefaultAvatarForUser } from '$lib/avatarBank';
	import { composerStore, closeComposer } from '$lib/stores/composerStore';

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
	let showSidebar = $derived(isAuthenticated && isAllowedUser && !$page.url.pathname.includes('access-denied'));

	// PostComposer modal state using store
	let showComposer = $derived($composerStore);

	// Avatar state with fallback logic
	let avatarUrl: string | null = $state(null);

	// Get fallback avatar with priority system
	function getFallbackAvatar(): string | null {
		if (!$currentUserProfile) return null;
		
		// Priority 1: User uploaded photo (handled by resolveAvatar)
		// Priority 2: Avatar selected from local bank
		// Priority 3: Default avatar based on user identifier
		const identifier = $currentUserProfile.email || $currentUserProfile.display_name || 'user';
		return getDefaultAvatarForUser(identifier);
	}

	// Update avatar URL when profile changes
	$effect(() => {
		if ($currentUserProfile?.avatar_url) {
			resolveAvatar($currentUserProfile).then(url => {
				avatarUrl = url || getFallbackAvatar();
			});
		} else {
			avatarUrl = getFallbackAvatar();
		}
	});

	function handleComposerOpen() {
		composerStore.set(true);
	}

	function handleComposerClose() {
		closeComposer();
	}

	// Auto-close composer on navigation
	afterNavigate(() => {
		closeComposer();
	});

	onMount(() => {
		// Handle service worker registration/unregistration based on PWA flag
		handleServiceWorker(env.PUBLIC_ENABLE_PWA === 'true');
		
		// Check if user is authenticated but not allowed
		if (isAuthenticated && userEmail && !isAllowedUser) {
			window.location.href = '/access-denied';
		}

		// Auto-refresh avatar URL every 55 minutes to prevent expiration
		const refreshInterval = setInterval(() => {
			if ($currentUserProfile?.avatar_url) {
				resolveAvatar($currentUserProfile).then(url => {
					avatarUrl = url || getFallbackAvatar();
				});
			}
		}, 55 * 60 * 1000);

		return () => clearInterval(refreshInterval);
	});
</script>

<svelte:head>
	<title>Family - Family Engagement App</title>
	<meta name="description" content="A family engagement platform for sharing, connecting, and growing together." />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Persistent Navigation -->
	{#if showSidebar}
		<!-- Desktop/Tablet Sidebar -->
		<div class="hidden md:block">
			<Sidebar onComposerOpen={handleComposerOpen} avatarUrl={avatarUrl} profile={$currentUserProfile} />
		</div>
	{/if}
	
	<!-- Mobile Topbar -->
	{#if isAuthenticated && isAllowedUser && !$page.url.pathname.includes('access-denied')}
		<div class="md:hidden bg-white border-b border-gray-200 px-4 py-3">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-lg font-semibold text-gray-900">
						Welcome back, {$currentUserProfile?.display_name || $currentUserProfile?.email?.split('@')[0] || 'User'} 🙏
					</h1>
					<p class="text-sm text-gray-500">Our family hub</p>
				</div>
				<div class="flex-shrink-0">
					{#if avatarUrl}
						<img 
							src={avatarUrl} 
							alt="Profile avatar"
							class="w-10 h-10 rounded-full object-cover ring-2 ring-primary-500 ring-offset-2 shadow-sm"
						/>
					{:else}
						<div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold ring-2 ring-primary-500 ring-offset-2 shadow-sm">
							{$currentUserProfile?.display_name?.[0]?.toUpperCase() || $currentUserProfile?.email?.[0]?.toUpperCase() || "U"}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Main Content Area -->
	<div class="transition-all duration-300 ease-in-out"
		class:md:ml-64={showSidebar}
		class:pb-20={showBottomNav}
	>
		<!-- Topbar Greeting (below nav, above content) -->
		{#if isAuthenticated && isAllowedUser && !$page.url.pathname.includes('access-denied')}
			<TopbarGreeting profile={$currentUserProfile} />
		{/if}
		
		{@render children?.()}
	</div>
	
	<!-- Mobile Bottom Navigation -->
	{#if showBottomNav}
		<div class="md:hidden">
			<BottomNav onComposerOpen={handleComposerOpen} avatarUrl={avatarUrl} profile={$currentUserProfile} />
		</div>
	{/if}
	
	<!-- PostComposer Modal -->
	{#if showComposer}
		<div class="fixed inset-0 bg-primary/80 backdrop-blur-sm z-40"></div>
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4"
			class:md:ml-64={showSidebar}
		>
			<div class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in">
				<PostComposer 
					onPostCreated={handleComposerClose}
					onCancel={handleComposerClose}
					placeholder="What's on your mind? Share something meaningful..."
				/>
			</div>
		</div>
	{/if}
	
	<!-- PWA Install Prompt (only if PWA is enabled) -->
	{#if env.PUBLIC_ENABLE_PWA === 'true'}
		<PWAInstallPrompt />
	{/if}
</div>
