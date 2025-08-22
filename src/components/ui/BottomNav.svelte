<script lang="ts">
	import { page } from '$app/stores';
	import { notificationStore } from '$lib/stores/notificationStore';
	import { Home, FileText, User, Bell } from 'lucide-svelte';

	let currentPath = $derived($page.url.pathname);
	let unreadCount = $derived(notificationStore.getUnreadCount());

	const iconMap = {
		'/dashboard': Home,
		'/posts': FileText,
		'/profile': User,
		'/notifications': Bell
	};

	let navItems = $derived([
		{ href: '/dashboard', label: 'Dashboard', icon: Home },
		{ href: '/posts', label: 'Posts', icon: FileText },
		{ href: '/profile', label: 'Profile', icon: User },
		{ href: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount }
	]);
</script>

<nav 
	class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe"
	style="padding-bottom: env(safe-area-inset-bottom);"
	aria-label="Main navigation"
>
	<div class="flex justify-around items-center h-16">
		{#each navItems as item}
			<a 
				href={item.href}
				class="flex flex-col items-center justify-center p-2 text-xs relative min-h-11 min-w-11 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
				class:text-primary-600={currentPath === item.href}
				class:text-gray-500={currentPath !== item.href}
				class:bg-primary-50={currentPath === item.href}
				aria-label="{item.label} page"
				aria-current={currentPath === item.href ? 'page' : undefined}
			>
				{#if item.href === '/dashboard'}
					<Home class="w-6 h-6 mb-1" aria-hidden="true" />
				{:else if item.href === '/posts'}
					<FileText class="w-6 h-6 mb-1" aria-hidden="true" />
				{:else if item.href === '/profile'}
					<User class="w-6 h-6 mb-1" aria-hidden="true" />
				{:else if item.href === '/notifications'}
					<Bell class="w-6 h-6 mb-1" aria-hidden="true" />
				{/if}
				<span class="font-medium">{item.label}</span>
				
				{#if item.badge && item.badge > 0}
					<span 
						class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
						aria-label="{item.badge} unread notifications"
					>
						{item.badge > 99 ? '99+' : item.badge}
					</span>
				{/if}
			</a>
		{/each}
	</div>
</nav>