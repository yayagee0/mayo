<script lang="ts">
	import { page } from '$app/stores';
	import { notificationStore } from '$lib/stores/notificationStore';
	import { openComposer } from '$lib/stores/composerStore';
	import { currentUserProfile } from '$lib/stores/profileStore';
	import { Home, FileText, User, Plus, Bell } from 'lucide-svelte';
	import AvatarDisplay from './AvatarDisplay.svelte';

	let currentPath = $derived($page.url.pathname);
	let unreadCount = $derived(notificationStore.getUnreadCount());
	let profile = $derived($currentUserProfile);

	// Props for backward compatibility
	interface Props {
		onComposerOpen?: () => void;
		avatarUrl?: string | null;
		profile?: { display_name?: string | null } | null;
	}
	
	let { onComposerOpen }: Props = $props();

	let navItems = $derived([
		{ href: '/dashboard', label: 'Dashboard', icon: Home, description: 'Smart widgets & overview' },
		{ href: '/posts', label: 'Wall', icon: FileText, description: 'Family posts & memories' },
		{ href: '#', label: 'Quick Post', icon: Plus, action: 'composer', description: 'Share something new' },
		{ href: '/notifications', label: 'Notifications', icon: Bell, unreadCount, description: 'Stay updated' },
		{ href: '/profile', label: 'Profile', icon: User, description: 'Your settings & info' }
	]);

	function handleItemClick(item: typeof navItems[0], event: Event) {
		if (item.action === 'composer') {
			event.preventDefault();
			openComposer();
		}
	}
</script>

<aside 
	class="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg z-40 flex flex-col @container"
	aria-label="Main navigation"
>
	<!-- Header -->
	<div class="p-6 border-b border-gray-200">
		<div class="text-center mb-4">
			<h1 class="text-xl font-bold text-gray-900 mb-2">Our Home 🏡</h1>
			
			<!-- Family initials crest -->
			<div class="flex justify-center gap-2 mb-3">
				<div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">G</div>
				<div class="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold">M</div>
				<div class="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-bold">Y</div>
				<div class="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">Y</div>
			</div>
			
			<p class="text-xs text-gray-500">Ghassan • Mariem • Yazid • Yahya</p>
		</div>
		
		<!-- Current user info -->
		<div class="flex items-center justify-center">
			<div class="me-3">
				<AvatarDisplay {profile} size="md" />
			</div>
			<div>
				<p class="text-sm font-medium text-gray-700">{profile?.display_name || 'Family Member'}</p>
			</div>
		</div>
	</div>
	
	<!-- Navigation Items -->
	<nav class="flex-1 p-4">
		<ul class="space-y-2">
			{#each navItems as item}
				{@const IconComponent = item.icon}
				<li>
					<a 
						href={item.href}
						onclick={(e) => handleItemClick(item, e)}
						class="flex items-center ps-4 pe-4 py-3 text-sm rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 group animate-slide-up"
						class:bg-gradient-to-r={currentPath === item.href}
						class:from-indigo-500={currentPath === item.href}
						class:to-purple-500={currentPath === item.href}
						class:text-white={currentPath === item.href}
						class:shadow-lg={currentPath === item.href}
						class:text-gray-700={currentPath !== item.href}
						class:hover:bg-indigo-50={currentPath !== item.href}
						class:hover:text-indigo-700={currentPath !== item.href}
						class:hover:scale-105={currentPath !== item.href}
						aria-label="{item.label} - {item.description}"
						aria-current={currentPath === item.href ? 'page' : undefined}
					>
						<div class="relative flex items-center min-w-0 flex-1">
							<IconComponent 
								class="w-5 h-5 me-3 flex-shrink-0 {currentPath === item.href ? 'text-white' : 'text-gray-500 group-hover:text-indigo-600'}" 
								aria-hidden="true" 
							/>
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between">
									<span class="font-medium truncate">{item.label}</span>
									{#if item.unreadCount && item.unreadCount > 0}
										<span class="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-5 ms-2">
											{item.unreadCount > 99 ? '99+' : item.unreadCount}
										</span>
									{/if}
								</div>
								<p class="text-xs {currentPath === item.href ? 'text-white/80' : 'text-gray-500'} truncate mt-0.5">{item.description}</p>
							</div>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
	
	<!-- Footer -->
	<div class="p-4 border-t border-gray-200">
		<div class="text-xs text-gray-500 text-center">
			<p>Family App</p>
			<p class="mt-1">Stay connected, grow together</p>
		</div>
	</div>
</aside>