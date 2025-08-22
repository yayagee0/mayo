<script lang="ts">
	import { onMount } from 'svelte';
	import { session } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { notificationStore } from '$lib/stores/notificationStore';
	import type { Notification } from '$lib/stores/notificationStore';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';

	dayjs.extend(relativeTime);

	let notifications: Notification[] = [];
	let loading = true;

	onMount(() => {
		if (!$session) {
			goto('/');
			return;
		}

		// Subscribe to notifications store
		const unsubscribe = notificationStore.subscribe(n => notifications = n);
		loading = false;

		// Add some sample notifications for demo
		if (notifications.length === 0) {
			notificationStore.add({
				type: 'info',
				title: 'Welcome to Mayo!',
				message: 'Start by updating your profile and sharing your first post.'
			});

			notificationStore.add({
				type: 'success',
				title: 'Birthday Reminder',
				message: 'Don\'t forget to wish John a happy birthday tomorrow!'
			});
		}

		return unsubscribe;
	});

	import { CheckCircle, AlertTriangle, XCircle, Info, Bell, X } from 'lucide-svelte';

	function getNotificationIcon(type: Notification['type']) {
		switch (type) {
			case 'success': return CheckCircle;
			case 'warning': return AlertTriangle;
			case 'error': return XCircle;
			default: return Info;
		}
	}

	function getNotificationColor(type: Notification['type']) {
		switch (type) {
			case 'success': return 'text-green-600 bg-green-50 border-green-200';
			case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'error': return 'text-red-600 bg-red-50 border-red-200';
			default: return 'text-blue-600 bg-blue-50 border-blue-200';
		}
	}
</script>

<svelte:head>
	<title>Notifications - Mayo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<h1 class="text-xl font-semibold text-gray-900">Notifications</h1>
				{#if notifications.some(n => !n.read)}
					<button
						type="button"
						on:click={() => notificationStore.markAllAsRead()}
						class="text-primary-600 hover:text-primary-700 font-medium text-sm"
					>
						Mark all as read
					</button>
				{/if}
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if loading}
			<div class="flex justify-center items-center h-64">
				<div class="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
			</div>
		{:else if notifications.length === 0}
			<div class="text-center py-12">
				<Bell class="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
				<h2 class="text-xl font-semibold text-gray-900 mb-2">No notifications yet</h2>
				<p class="text-gray-500">When something happens in your family, you'll see it here.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each notifications as notification (notification.id)}
					<div 
						class="p-4 border rounded-lg {getNotificationColor(notification.type)}"
						class:opacity-60={notification.read}
					>
						<div class="flex items-start gap-3">
							<svelte:component 
								this={getNotificationIcon(notification.type)} 
								class="w-5 h-5 mt-0.5 flex-shrink-0" 
								aria-hidden="true"
							/>
							<div class="flex-1">
								<div class="flex items-center justify-between mb-1">
									<h3 class="font-semibold">{notification.title}</h3>
									<div class="flex items-center gap-2">
										<span class="text-xs opacity-75">
											{dayjs(notification.createdAt).fromNow()}
										</span>
										{#if !notification.read}
											<button
												type="button"
												on:click={() => notificationStore.markAsRead(notification.id)}
												class="text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
											>
												Mark read
											</button>
										{/if}
									</div>
								</div>
								<p class="text-sm opacity-90">{notification.message}</p>
							</div>
							<button
								type="button"
								on:click={() => notificationStore.remove(notification.id)}
								class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
								aria-label="Remove notification"
							>
								<X class="w-4 h-4" aria-hidden="true" />
							</button>
						</div>
					</div>
				{/each}
			</div>

			{#if notifications.length > 0}
				<div class="mt-8 text-center">
					<button
						type="button"
						on:click={() => notificationStore.clear()}
						class="text-red-600 hover:text-red-700 font-medium text-sm"
					>
						Clear all notifications
					</button>
				</div>
			{/if}
		{/if}
	</main>
</div>