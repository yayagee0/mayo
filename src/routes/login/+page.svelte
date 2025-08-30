<script lang="ts">
  import { signInWithGoogle } from '$lib/firebase';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/firebase';
  import { onAuthStateChanged } from 'firebase/auth';
  import { validateUserAccess } from '$lib/allowlist';
  import { onMount } from 'svelte';

  let loading = $state(false);
  let error = $state('');

  onMount(() => {
    // Redirect if already authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && validateUserAccess(user)) {
        goto('/dashboard');
      }
    });

    return unsubscribe;
  });

  async function handleGoogleSignIn() {
    try {
      loading = true;
      error = '';
      
      const { user, error: signInError } = await signInWithGoogle();
      
      if (signInError) {
        throw signInError;
      }

      if (user && !validateUserAccess(user)) {
        error = 'Access denied. Your email is not in the family allowlist.';
        // Sign out the user since they're not allowed
        await auth.signOut();
        return;
      }

      // User will be redirected automatically by the auth state listener
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred during sign-in';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Login - Mayo Family Platform</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-blue-600 mb-2">Mayo</h1>
      <h2 class="text-2xl font-semibold text-gray-900 mb-2">Family Platform</h2>
      <p class="text-gray-600">Private family engagement space</p>
    </div>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="card">
      <div class="text-center mb-6">
        <h3 class="text-lg font-medium text-gray-900">Welcome Back</h3>
        <p class="text-sm text-gray-600 mt-1">Sign in with your family Google account</p>
      </div>

      {#if error}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-700">{error}</p>
        </div>
      {/if}

      <button
        onclick={handleGoogleSignIn}
        disabled={loading}
        class="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {#if loading}
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 mr-3"></div>
          Signing in...
        {:else}
          <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        {/if}
      </button>

      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500">
          Only family members can access this platform.<br>
          Contact the administrator if you need access.
        </p>
      </div>
    </div>
  </div>
</div>