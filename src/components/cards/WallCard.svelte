<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { supabase } from '$lib/supabase';
	import { eventBus } from '$lib/eventBus';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';

	dayjs.extend(relativeTime);

	interface Props extends WidgetProps {}

	let { session, profiles, items, interactions }: Props = $props();

	let recentPosts = $derived(items
		.filter(item => item.kind === 'post' && !item.is_deleted)
		.sort((a, b) => dayjs(b.created_at).unix() - dayjs(a.created_at).unix())
		.slice(0, 3));

	let showComposer = $state(false);
	let postContent = $state('');
	let uploading = $state(false);

	async function createPost() {
		if (!postContent.trim() || !session?.user?.email) return;

		try {
			uploading = true;
			const { error } = await supabase.from('items').insert({
				kind: 'post',
				author_email: session.user.email,
				author_id: session.user.id,
				body: postContent.trim(),
				visibility: 'family'
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
</script>

<div class="card">
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-2">
			<span class="text-2xl">🏠</span>
			<h3 class="text-lg font-semibold text-gray-900">Family Wall</h3>
		</div>
		<button
			onclick={() => showComposer = !showComposer}
			class="text-primary-600 hover:text-primary-700 text-sm font-medium"
		>
			{showComposer ? 'Cancel' : '+ Post'}
		</button>
	</div>

	{#if showComposer}
		<div class="border border-gray-200 rounded-lg p-4 mb-4">
			<textarea
				bind:value={postContent}
				placeholder="Share something with your family..."
				rows="3"
				class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
			></textarea>
			<div class="flex justify-between items-center mt-3">
				<div class="flex gap-2">
					<button class="text-gray-400 hover:text-gray-600 text-sm">📷 Photo</button>
					<button class="text-gray-400 hover:text-gray-600 text-sm">🎥 Video</button>
					<button class="text-gray-400 hover:text-gray-600 text-sm">📍 Location</button>
				</div>
				<button
					onclick={createPost}
					disabled={!postContent.trim() || uploading}
					class="btn btn-primary text-sm disabled:opacity-50"
				>
					{uploading ? 'Posting...' : 'Post'}
				</button>
			</div>
		</div>
	{/if}

	<div class="space-y-4">
		{#if recentPosts.length === 0}
			<div class="text-center py-6 text-gray-500">
				<p class="mb-2">No posts yet!</p>
				<button
					onclick={() => showComposer = true}
					class="text-primary-600 hover:text-primary-700 font-medium"
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
							
							<p class="text-gray-700 whitespace-pre-wrap">
								{post.body}
							</p>
							
							<div class="flex items-center gap-4 mt-3">
								<button
									onclick={() => toggleLike(post.id)}
									class="flex items-center gap-1 text-sm transition-colors"
									class:text-red-600={isLiked(post.id)}
									class:text-gray-500={!isLiked(post.id)}
								>
									<span>{isLiked(post.id) ? '❤️' : '🤍'}</span>
									<span>{getLikeCount(post.id)}</span>
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
		{/if}

		{#if recentPosts.length > 0}
			<div class="text-center">
				<a href="/posts" class="text-primary-600 hover:text-primary-700 font-medium text-sm">
					View all posts →
				</a>
			</div>
		{/if}
	</div>
</div>