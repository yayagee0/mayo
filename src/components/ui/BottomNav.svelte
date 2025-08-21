<script lang="ts">
	import { page } from '$app/stores';
	import { notificationStore } from '$lib/stores/notificationStore';

	let currentPath = $derived($page.url.pathname);
	let unreadCount = $derived(notificationStore.getUnreadCount());

	let navItems = $derived([
		{ href: '/dashboard', label: 'Dashboard', icon: '🏠' },
		{ href: '/posts', label: 'Posts', icon: '📝' },
		{ href: '/profile', label: 'Profile', icon: '👤' },
		{ href: '/notifications', label: 'Notifications', icon: '🔔', badge: unreadCount }
	]);
</script>

<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
	<div class="flex justify-around items-center h-16">
		{#each navItems as item}
			<a 
				href={item.href}
				class="flex flex-col items-center justify-center p-2 text-xs relative"
				class:text-primary-600={currentPath === item.href}
				class:text-gray-500={currentPath !== item.href}
			>
				<span class="text-lg mb-1">{item.icon}</span>
				<span class="font-medium">{item.label}</span>
				
				{#if item.badge && item.badge > 0}
					<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
						{item.badge > 99 ? '99+' : item.badge}
					</span>
				{/if}
			</a>
		{/each}
	</div>
</nav>