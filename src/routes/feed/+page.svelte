<script lang="ts">
  import { onMount } from 'svelte';
  import { getPosts } from '$lib/firebase';
  import { FAMILY_ID } from '$lib/allowlist';
  import { auth } from '$lib/firebase';
  import FeedUpload from '$lib/FeedUpload.svelte';
  import { Heart, MessageCircle, Share2, Calendar, Youtube, Image as ImageIcon, Video } from 'lucide-svelte';

  let user = $state(null);
  let posts = $state([]);
  let loading = $state(true);

  onMount(async () => {
    user = auth.currentUser;
    
    try {
      posts = await getPosts(FAMILY_ID);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      loading = false;
    }
  });

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getYouTubeEmbedUrl(youtubeId: string) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  function getPostTypeIcon(kind: string) {
    switch (kind) {
      case 'youtube': return Youtube;
      case 'photo': return ImageIcon;
      case 'video': return Video;
      default: return MessageCircle;
    }
  }

  function getPostTypeColor(kind: string) {
    switch (kind) {
      case 'youtube': return 'text-red-600';
      case 'photo': return 'text-green-600';
      case 'video': return 'text-purple-600';
      default: return 'text-blue-600';
    }
  }
</script>

<svelte:head>
  <title>Feed - Mayo Family Platform</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Header -->
  <div class="text-center">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Family Feed</h1>
    <p class="text-gray-600">Share moments and stay connected with your family</p>
  </div>

  <!-- Post Upload Form -->
  <FeedUpload bind:user />

  <!-- Posts List -->
  <div class="space-y-6">
    <div class="border-t border-gray-200 pt-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Posts</h2>
      
      {#if loading}
        <div class="space-y-4">
          {#each Array(3) as _}
            <div class="card animate-pulse">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div class="flex-1">
                  <div class="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div class="h-3 bg-gray-300 rounded w-1/6"></div>
                </div>
              </div>
              <div class="h-20 bg-gray-300 rounded mb-4"></div>
              <div class="flex space-x-4">
                <div class="h-8 bg-gray-300 rounded w-16"></div>
                <div class="h-8 bg-gray-300 rounded w-16"></div>
                <div class="h-8 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if posts.length === 0}
        <div class="card text-center py-12">
          <Heart class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p class="text-gray-600 mb-4">Be the first to share something with your family!</p>
        </div>
      {:else}
        <div class="space-y-6">
          {#each posts as post (post.id)}
            <article class="card">
              <!-- Post Header -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff`}
                    alt="User avatar"
                    class="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 class="font-medium text-gray-900">Family Member</h3>
                    <p class="text-sm text-gray-600">{formatDate(post.createdAt)}</p>
                  </div>
                </div>
                
                <div class="flex items-center space-x-2">
                  {@const Icon = getPostTypeIcon(post.kind)}
                  <Icon class="h-5 w-5 {getPostTypeColor(post.kind)}" />
                  <span class="text-sm text-gray-600 capitalize">{post.kind}</span>
                </div>
              </div>

              <!-- Post Content -->
              <div class="space-y-4">
                <!-- Text Content -->
                {#if post.text}
                  <p class="text-gray-900 whitespace-pre-wrap">{post.text}</p>
                {/if}

                <!-- YouTube Video -->
                {#if post.kind === 'youtube' && post.youtubeId}
                  <div class="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={getYouTubeEmbedUrl(post.youtubeId)}
                      title="YouTube video"
                      class="w-full h-full"
                      frameborder="0"
                      allowfullscreen
                    ></iframe>
                  </div>
                {/if}

                <!-- Photo -->
                {#if post.kind === 'photo' && post.imagePath}
                  <div class="rounded-lg overflow-hidden">
                    <img
                      src={post.imagePath}
                      alt="Posted image"
                      class="w-full h-auto max-h-96 object-cover"
                      loading="lazy"
                    />
                  </div>
                {/if}

                <!-- Video -->
                {#if post.kind === 'video' && post.videoPath}
                  <div class="rounded-lg overflow-hidden">
                    <video
                      src={post.videoPath}
                      controls
                      class="w-full h-auto max-h-96"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                {/if}
              </div>

              <!-- Post Actions -->
              <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div class="flex items-center space-x-6">
                  <button class="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors">
                    <Heart class="h-5 w-5" />
                    <span class="text-sm">Like</span>
                  </button>
                  <button class="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <MessageCircle class="h-5 w-5" />
                    <span class="text-sm">Comment</span>
                  </button>
                  <button class="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
                    <Share2 class="h-5 w-5" />
                    <span class="text-sm">Share</span>
                  </button>
                </div>
                
                <div class="text-xs text-gray-500">
                  {formatDate(post.createdAt)}
                </div>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>