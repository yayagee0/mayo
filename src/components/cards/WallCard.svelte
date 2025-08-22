<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { supabase } from '$lib/supabase';
	import { eventBus } from '$lib/eventBus';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import { Home, Plus, X, Camera, Video, MapPin, Heart, MessageCircle, Share2 } from 'lucide-svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import { profileStore } from '$lib/stores/profileStore';

	dayjs.extend(relativeTime);

	interface Props extends WidgetProps {}

	let { session, items, interactions }: Props = $props();

	// Subscribe to profileStore instead of using props
	let profiles = $derived($profileStore);

	let recentPosts = $derived(items
		.filter(item => item.kind === 'post' && !item.is_deleted)
		.sort((a, b) => dayjs(b.created_at).unix() - dayjs(a.created_at).unix())
		.slice(0, 3));

	let showComposer = $state(false);
	let postContent = $state('');
	let uploading = $state(false);
	let error = $state('');
	let expandedPosts = $state(new Set<string>());

	async function createPost() {
		if (!postContent.trim() || !session?.user?.email) return;

		try {
			uploading = true;
			const { error } = await supabase.from('items').insert({
				kind: 'post',
				author_email: session.user.email,
				author_id: session.user.id,
				body: postContent.trim(),
				visibility: 'all'
			});

			if (error) throw error;

			postContent = '';
			showComposer = false;
			
			eventBus.emit('postCreated', {
				itemId: '',
				authorEmail: session.user.email,
				content: postContent
			});

			// Refresh items by triggering a re-fetch (simplified for demo)
			location.reload();
		} catch (err) {
			console.error('Error creating post:', err);
			error = 'Failed to create post. Please try again.';
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
		if (!session?.user?.email) return;

		const existingLike = interactions.find(
			i => i.item_id === itemId && i.user_email === session.user.email && i.type === 'like'
		);

		try {
			if (existingLike) {
				await supabase
					.from('interactions')
					.delete()
					.eq('item_id', itemId)
					.eq('user_email', session.user.email)
					.eq('type', 'like');
			} else {
				await supabase.from('interactions').insert({
					item_id: itemId,
					user_email: session.user.email,
					type: 'like'
				});
			}
		} catch (error) {
			console.error('Error toggling like:', error);
		}
	}

	function isLiked(itemId: string): boolean {
		return interactions.some(
			i => i.item_id === itemId && i.user_email === session?.user?.email && i.type === 'like'
		);
	}

	function getLikeCount(itemId: string): number {
		return interactions.filter(i => i.item_id === itemId && i.type === 'like').length;
	}

	function shouldTruncateText(text: string): boolean {
		// Estimate if text would exceed 3 lines (rough calculation)
		return text.length > 150 || text.split('\n').length > 3;
	}

	function truncateText(text: string): string {
		if (text.length <= 150) return text;
		return text.substring(0, 150) + '...';
	}

	function toggleExpanded(postId: string) {
		if (expandedPosts.has(postId)) {
			expandedPosts.delete(postId);
		} else {
			expandedPosts.add(postId);
		}
		expandedPosts = new Set(expandedPosts);
	}
</script>

<ComponentErrorBoundary componentName="WallCard">
<div class="card">
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-2">
			<Home class="w-6 h-6 text-blue-500" aria-hidden="true" />
			<h3 class="text-lg font-semibold text-gray-900">Family Wall</h3>
		</div>
		<button
			onclick={() => showComposer = !showComposer}
			class="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
			aria-label={showComposer ? 'Cancel post' : 'Create new post'}
		>
			{#if showComposer}
				<X class="w-4 h-4" aria-hidden="true" />
				Cancel
			{:else}
				<Plus class="w-4 h-4" aria-hidden="true" />
				Post
			{/if}
		</button>
	</div>

	{#if showComposer}
		<div class="border border-gray-200 rounded-lg p-4 mb-4">
			<textarea
				bind:value={postContent}
				oninput={() => error = ''}
				placeholder="Share something with your family..."
				rows="3"
				class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
			></textarea>
			
			{#if error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
					<p class="text-red-700 text-sm">{error}</p>
				</div>
			{/if}
			
			<div class="flex justify-between items-center mt-3">
				<div class="flex gap-2">
					<button 
						class="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm transition-colors"
						aria-label="Add photo"
					>
						<Camera class="w-4 h-4" aria-hidden="true" />
						Photo
					</button>
					<button 
						class="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm transition-colors"
						aria-label="Add video"
					>
						<Video class="w-4 h-4" aria-hidden="true" />
						Video
					</button>
					<button 
						class="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm transition-colors"
						aria-label="Add location"
					>
						<MapPin class="w-4 h-4" aria-hidden="true" />
						Location
					</button>
				</div>
				<button
					onclick={createPost}
					disabled={!postContent.trim() || uploading}
					class="btn btn-primary text-sm disabled:opacity-50 flex items-center gap-2"
				>
					{#if uploading}
						<Loading size="sm" text="" />
						Posting...
					{:else}
						Post
					{/if}
				</button>
			</div>
		</div>
	{/if}

	<div class="space-y-4">
		{#if recentPosts.length === 0}
			<div class="text-center py-8">
				<Home class="w-12 h-12 text-gray-300 mx-auto mb-2" aria-hidden="true" />
				<p class="text-gray-500 mb-2">No posts yet!</p>
				<button
					onclick={() => showComposer = true}
					class="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
				>
					Be the first to share
				</button>
			</div>
		{:else}
			{#each recentPosts as post (post.id)}
				<div class="border border-gray-200 rounded-lg p-4">
					<div class="flex items-start gap-3">
						{#if getAuthorAvatar(post.author_email)}
							<img 
								src={getAuthorAvatar(post.author_email)} 
								alt={getAuthorName(post.author_email)}
								class="w-10 h-10 rounded-full object-cover"
							/>
						{:else}
							<div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
								<span class="text-primary-600 font-semibold">
									{getAuthorName(post.author_email).charAt(0).toUpperCase()}
								</span>
							</div>
						{/if}
						
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<span class="font-medium text-gray-900">
									{getAuthorName(post.author_email)}
								</span>
								<span class="text-gray-500 text-sm">
									{dayjs(post.created_at).fromNow()}
								</span>
							</div>
							
							<div class="text-gray-700 whitespace-pre-wrap">
								{#if post.body && shouldTruncateText(post.body) && !expandedPosts.has(post.id)}
									<p>{truncateText(post.body)}</p>
									<button
										onclick={() => toggleExpanded(post.id)}
										class="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
									>
										Show more
									</button>
								{:else}
									<p>{post.body || ''}</p>
									{#if post.body && shouldTruncateText(post.body)}
										<button
											onclick={() => toggleExpanded(post.id)}
											class="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
										>
											Show less
										</button>
									{/if}
								{/if}
							</div>
							
							<div class="flex items-center gap-4 mt-3">
								<button
									onclick={() => toggleLike(post.id)}
									class="flex items-center gap-1 text-sm transition-colors min-h-8 min-w-8 rounded p-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
									class:text-red-600={isLiked(post.id)}
									class:text-gray-500={!isLiked(post.id)}
									aria-label="{isLiked(post.id) ? 'Unlike' : 'Like'} this post"
								>
									<Heart 
										class="w-4 h-4 {isLiked(post.id) ? 'fill-current' : ''}" 
										aria-hidden="true"
									/>
									<span>{getLikeCount(post.id)}</span>
								</button>
								<button 
									class="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm transition-colors min-h-8 rounded p-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
									aria-label="Comment on post"
								>
									<MessageCircle class="w-4 h-4" aria-hidden="true" />
									Comment
								</button>
								<button 
									class="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm transition-colors min-h-8 rounded p-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
									aria-label="Share post"
								>
									<Share2 class="w-4 h-4" aria-hidden="true" />
									Share
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		{/if}

		{#if recentPosts.length > 0}
			<div class="text-center">
				<a 
					href="/posts" 
					class="text-primary-600 hover:text-primary-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
				>
					View all posts →
				</a>
			</div>
		{/if}
	</div>
</ComponentErrorBoundary>