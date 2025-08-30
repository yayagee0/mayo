<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/firebase';
  import { onAuthStateChanged } from 'firebase/auth';
  import { validateUserAccess } from '$lib/allowlist';
  import Nav from '$lib/Nav.svelte';

  let { children } = $props();
  
  let user = $state(null);
  let loading = $state(true);
  let isAuthenticated = $derived(!!user);
  let isAllowedUser = $derived(user ? validateUserAccess(user) : false);
  let showNav = $derived(isAuthenticated && isAllowedUser && 
    !$page.url.pathname.includes('/login') && 
    !$page.url.pathname.includes('/access-denied'));

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      user = firebaseUser;
      loading = false;

      // Handle authentication and authorization
      if (!firebaseUser && $page.url.pathname !== '/login') {
        goto('/login');
      } else if (firebaseUser && !validateUserAccess(firebaseUser) && 
                 $page.url.pathname !== '/access-denied') {
        goto('/access-denied');
      } else if (firebaseUser && validateUserAccess(firebaseUser) && 
                 $page.url.pathname === '/login') {
        goto('/dashboard');
      }
    });

    return unsubscribe;
  });
</script>

<svelte:head>
  <title>Mayo - Family Engagement Platform</title>
  <meta name="description" content="Private family engagement platform" />
</svelte:head>

{#if loading}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50">
    {#if showNav}
      <Nav bind:user />
      <main class="md:ml-64 pb-16 md:pb-0">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {@render children()}
        </div>
      </main>
    {:else}
      <main>
        {@render children()}
      </main>
    {/if}
  </div>
{/if}
