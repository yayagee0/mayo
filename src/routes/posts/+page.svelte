<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { eventBus } from '$lib/eventBus';
	import type { Database } from '$lib/supabase';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import PostComposer from '$lib/../components/PostComposer.svelte';
	import PostCard from '$lib/../components/PostCard.svelte';
	import { profileStore } from '$lib/stores/profileStore';

	dayjs.extend(relativeTime);

	let posts: Database['public']['Tables']['items']['Row'][] = $state([]);
	let allItems: Database['public']['Tables']['items']['Row'][] = $state([]); // Include posts and comments
	let interactions: Database['public']['Tables']['interactions']['Row'][] = $state([]);
	let loading = $state(true);
	let loadingMore = $state(false);
	let page = $state(0);
	const postsPerPage = 10;

	// Use profileStore instead of local profiles state
	let profiles = $derived($profileStore);

	// Post composer state
	let showComposer = $state(false);
	
	// Get comments for each post
	let commentsMap = $derived(() => {
		const map = new Map<string, Database['public']['Tables']['items']['Row'][]>();
		
		allItems
			.filter(item => item.kind === 'comment' && item.parent_id)
			.forEach(comment => {
				const parentId = comment.parent_id!;
				if (!map.has(parentId)) {
					map.set(parentId, []);
				}
				map.get(parentId)!.push(comment);
			});
			
		// Sort comments by creation date
		map.forEach((comments, postId) => {
			comments.sort((a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix());
		});
		
		return map;
	});

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
			loadAllItems(),
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

	async function loadAllItems() {
		try {
			const { data } = await supabase
				.from('items')
				.select('*')
				.eq('is_deleted', false)
				.order('created_at', { ascending: false });

			allItems = data || [];
		} catch (error) {
			console.error('Error loading all items:', error);
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

	function handlePostCreated() {
		showComposer = false;
		// Refresh all data
		loadData();
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
					onclick={() => showComposer = !showComposer}
					class="btn btn-primary"
				>
					{showComposer ? 'Cancel' : '+ New Post'}
				</button>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if showComposer}
			<div class="mb-6">
				<PostComposer 
					onPostCreated={handlePostCreated}
					onCancel={() => showComposer = false}
					placeholder="What's on your mind? Share something meaningful..."
				/>
			</div>
		{/if}

		{#if loading}
			<Loading text="Loading posts..." />
		{:else}
			<div class="space-y-6">
				{#if posts.length === 0}
					<div class="text-center py-12">
						<p class="text-gray-500 mb-4">No posts yet!</p>
						<button
							type="button"
							onclick={() => showComposer = true}
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
											onclick={() => toggleLike(post.id)}
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
								onclick={loadMorePosts}
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