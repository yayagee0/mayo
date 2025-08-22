<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { eventBus } from '$lib/eventBus';
	import type { Database } from '$lib/supabase';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';

	dayjs.extend(relativeTime);

	let posts: Database['public']['Tables']['items']['Row'][] = [];
	let profiles: Database['public']['Tables']['profiles']['Row'][] = [];
	let interactions: Database['public']['Tables']['interactions']['Row'][] = [];
	let loading = true;
	let loadingMore = false;
	let page = 0;
	const postsPerPage = 10;

	// Post composer state
	let showComposer = false;
	let postContent = '';
	let uploading = false;

	onMount(async () => {
		if (!$session) {
			goto('/');
			return;
		}

		await loadData();
		loading = false;
	});

	async function loadData() {
		await Promise.all([
			loadPosts(),
			loadProfiles(),
			loadInteractions()
		]);
	}

	async function loadPosts(append = false) {
		try {
			const { data } = await supabase
				.from('items')
				.select('*')
				.eq('kind', 'post')
				.eq('is_deleted', false)
				.order('created_at', { ascending: false })
				.range(page * postsPerPage, (page + 1) * postsPerPage - 1);

			if (data) {
				if (append) {
					posts = [...posts, ...data];
				} else {
					posts = data;
				}
			}
		} catch (error) {
			console.error('Error loading posts:', error);
		}
	}

	async function loadProfiles() {
		try {
			const { data } = await supabase
				.from('profiles')
				.select('*');
			
			profiles = data || [];
		} catch (error) {
			console.error('Error loading profiles:', error);
		}
	}

	async function loadInteractions() {
		try {
			const { data } = await supabase
				.from('interactions')
				.select('*');
			
			interactions = data || [];
		} catch (error) {
			console.error('Error loading interactions:', error);
		}
	}

	async function loadMorePosts() {
		if (loadingMore) return;
		
		loadingMore = true;
		page++;
		await loadPosts(true);
		loadingMore = false;
	}

	async function createPost() {
		if (!postContent.trim() || !$session?.user?.email) return;

		try {
			uploading = true;
			const { error } = await supabase.from('items').insert({
				kind: 'post',
				author_email: $session.user.email,
				author_id: $session.user.id,
				body: postContent.trim(),
				visibility: 'family'
			});

			if (error) throw error;

			postContent = '';
			showComposer = false;
			
			eventBus.emit('postCreated', {
				itemId: '',
				authorEmail: $session.user.email,
				content: postContent
			});

			// Refresh posts
			page = 0;
			await loadPosts();
		} catch (error) {
			console.error('Error creating post:', error);
		} finally {
			uploading = false;
		}
	}

	function getAuthorName(email: string) {
		const profile = profiles.find(p => p.email === email);
		return profile?.display_name || email.split('@')[0];
	}

	function getAuthorAvatar(email: string) {
		const profile = profiles.find(p => p.email === email);
		return profile?.avatar_url;
	}

	async function toggleLike(itemId: string) {
		if (!$session?.user?.email) return;

		const existingLike = interactions.find(
			i => i.item_id === itemId && i.user_email === $session.user.email && i.type === 'like'
		);

		try {
			if (existingLike) {
				await supabase
					.from('interactions')
					.delete()
					.eq('item_id', itemId)
					.eq('user_email', $session.user.email)
					.eq('type', 'like');

				interactions = interactions.filter(i => 
					!(i.item_id === itemId && i.user_email === $session.user.email && i.type === 'like')
				);
			} else {
				const { data } = await supabase.from('interactions').insert({
					item_id: itemId,
					user_email: $session.user.email,
					type: 'like'
				}).select().single();

				if (data) {
					interactions = [...interactions, data];
				}
			}
		} catch (error) {
			console.error('Error toggling like:', error);
		}
	}

	function isLiked(itemId: string): boolean {
		return interactions.some(
			i => i.item_id === itemId && i.user_email === $session?.user?.email && i.type === 'like'
		);
	}

	function getLikeCount(itemId: string): number {
		return interactions.filter(i => i.item_id === itemId && i.type === 'like').length;
	}
</script>

<svelte:head>
	<title>Posts - Mayo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<header class="bg-white shadow-sm border-b sticky top-0 z-40">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<h1 class="text-xl font-semibold text-gray-900">Family Posts</h1>
				<button
					type="button"
					on:click={() => showComposer = !showComposer}
					class="btn btn-primary"
				>
					{showComposer ? 'Cancel' : '+ New Post'}
				</button>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if showComposer}
			<div class="card mb-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Share with your family</h3>
				<textarea
					bind:value={postContent}
					placeholder="What's on your mind? Share something meaningful..."
					rows="4"
					class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
				></textarea>
				<div class="flex justify-between items-center mt-4">
					<div class="flex gap-2">
						<button class="text-gray-400 hover:text-gray-600 text-sm">📷 Photo</button>
						<button class="text-gray-400 hover:text-gray-600 text-sm">🎥 Video</button>
						<button class="text-gray-400 hover:text-gray-600 text-sm">📍 Location</button>
					</div>
					<button
						type="button"
						on:click={createPost}
						disabled={!postContent.trim() || uploading}
						class="btn btn-primary disabled:opacity-50"
					>
						{uploading ? 'Posting...' : 'Post'}
					</button>
				</div>
			</div>
		{/if}

		{#if loading}
			<div class="flex justify-center items-center h-64">
				<div class="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
			</div>
		{:else}
			<div class="space-y-6">
				{#if posts.length === 0}
					<div class="text-center py-12">
						<p class="text-gray-500 mb-4">No posts yet!</p>
						<button
							type="button"
							on:click={() => showComposer = true}
							class="btn btn-primary"
						>
							Share the first post
						</button>
					</div>
				{:else}
					{#each posts as post (post.id)}
						<div class="card">
							<div class="flex items-start gap-4">
								{#if getAuthorAvatar(post.author_email)}
									<img 
										src={getAuthorAvatar(post.author_email)} 
										alt={getAuthorName(post.author_email)}
										class="w-12 h-12 rounded-full object-cover"
									/>
								{:else}
									<div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
										<span class="text-primary-600 font-semibold text-lg">
											{getAuthorName(post.author_email).charAt(0).toUpperCase()}
										</span>
									</div>
								{/if}
								
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-2">
										<span class="font-semibold text-gray-900">
											{getAuthorName(post.author_email)}
										</span>
										<span class="text-gray-500 text-sm">
											{dayjs(post.created_at).fromNow()}
										</span>
									</div>
									
									<p class="text-gray-700 whitespace-pre-wrap mb-4">
										{post.body}
									</p>
									
									<div class="flex items-center gap-6">
										<button
											type="button"
											on:click={() => toggleLike(post.id)}
											class="flex items-center gap-2 text-sm transition-colors"
											class:text-red-600={isLiked(post.id)}
											class:text-gray-500={!isLiked(post.id)}
										>
											<span class="text-lg">{isLiked(post.id) ? '❤️' : '🤍'}</span>
											<span>{getLikeCount(post.id)} {getLikeCount(post.id) === 1 ? 'like' : 'likes'}</span>
										</button>
										<button class="text-gray-500 hover:text-gray-700 text-sm">
											💬 Comment
										</button>
										<button class="text-gray-500 hover:text-gray-700 text-sm">
											🔗 Share
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
					
					{#if posts.length >= postsPerPage}
						<div class="text-center py-6">
							<button
								type="button"
								on:click={loadMorePosts}
								disabled={loadingMore}
								class="btn btn-secondary disabled:opacity-50"
							>
								{loadingMore ? 'Loading...' : 'Load More Posts'}
							</button>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</main>
</div>