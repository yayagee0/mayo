<script lang="ts">
	import { page } from '$app/stores';
	import { notificationStore } from '$lib/stores/notificationStore';
	import { openComposer } from '$lib/stores/composerStore';
	import { currentUserAvatar } from '$lib/stores/avatarStore';
	import { currentUserProfile } from '$lib/stores/profileStore';
	import { Home, FileText, User, Plus, Bell } from 'lucide-svelte';

	let currentPath = $derived($page.url.pathname);
	let unreadCount = $derived(notificationStore.getUnreadCount());
	let avatarUrl = $derived($currentUserAvatar);
	let profile = $derived($currentUserProfile);

	// Props for handling composer action and avatar - kept for backward compatibility
	interface Props {
		onComposerOpen?: () => void;
		avatarUrl?: string | null;
		profile?: { display_name?: string | null } | null;
	}
	
	let { onComposerOpen, avatarUrl: propAvatarUrl, profile: propProfile }: Props = $props();

	// Use store values as primary, props as fallback
	let displayAvatarUrl = $derived(avatarUrl || propAvatarUrl);
	let displayProfile = $derived(profile || propProfile);

	let navItems = $derived([
		{ href: '/dashboard', label: 'Home', icon: Home },
		{ href: '/posts', label: 'Posts', icon: FileText },
		{ href: '#', label: 'Add', icon: Plus, action: 'composer' },
		{ href: '/notifications', label: 'Notifications', icon: Bell, unreadCount },
		{ href: '/profile', label: 'Profile', icon: User }
	]);

	function handleItemClick(item: typeof navItems[0], event: Event) {
		if (item.action === 'composer') {
			event.preventDefault();
			openComposer();
		}
	}
</script>

<nav 
	class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe"
	style="padding-bottom: env(safe-area-inset-bottom);"
	aria-label="Main navigation"
>
	<div class="flex justify-around items-center h-16">
		{#each navItems as item}
			{@const IconComponent = item.icon}
			<a 
				href={item.href}
				onclick={(e) => handleItemClick(item, e)}
				class="flex flex-col items-center justify-center p-2 text-xs relative min-h-11 min-w-11 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
				class:text-primary-600={currentPath === item.href}
				class:text-gray-500={currentPath !== item.href}
				class:bg-primary-50={currentPath === item.href}
				class:font-semibold={currentPath === item.href}
				class:shadow-sm={currentPath === item.href}
				aria-label="{item.label} page"
				aria-current={currentPath === item.href ? 'page' : undefined}
			>
				<div class="relative">
					{#if item.href === '/profile'}
						<!-- Show avatar for profile item -->
						{#if displayAvatarUrl}
							<img 
								src={displayAvatarUrl} 
								alt="Profile avatar"
								class="w-6 h-6 rounded-full object-cover border border-gray-200 mb-1"
								onerror={() => displayAvatarUrl = null}
							/>
						{:else}
							<div class="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold mb-1">
								{displayProfile?.display_name?.[0]?.toUpperCase() ?? "U"}
							</div>
						{/if}
					{:else}
						<!-- Show icon for other items -->
						<IconComponent 
							class="w-6 h-6 mb-1 {currentPath === item.href ? 'stroke-2' : 'stroke-1'}" 
							aria-hidden="true" 
						/>
					{/if}
					{#if item.unreadCount && item.unreadCount > 0}
						<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-5">
							{item.unreadCount > 99 ? '99+' : item.unreadCount}
						</span>
					{/if}
				</div>
				<span class="font-medium">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>