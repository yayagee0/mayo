<script lang="ts">
  import { page } from '$app/stores';
  import { House, User, Rss, LogOut } from 'lucide-svelte';
  import { signOutUser } from './firebase';
  import { goto } from '$app/navigation';

  let { user = $bindable() } = $props();

  async function handleSignOut() {
    await signOutUser();
    goto('/login');
  }

  const navItems = [
    { href: '/dashboard', icon: House, label: 'Dashboard' },
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/feed', icon: Rss, label: 'Feed' }
  ];
</script>

<!-- Desktop Sidebar -->
<aside class="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200">
  <div class="flex-1 flex flex-col min-h-0">
    <div class="flex items-center h-16 px-4 bg-blue-600">
      <h1 class="text-xl font-bold text-white">Mayo</h1>
    </div>
    
    <nav class="flex-1 px-2 py-4 space-y-1">
      {#each navItems as item}
        <a
          href={item.href}
          class="group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                 {$page.url.pathname === item.href 
                   ? 'bg-blue-100 text-blue-900' 
                   : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
        >
          <item.icon class="mr-3 h-5 w-5 flex-shrink-0" />
          {item.label}
        </a>
      {/each}
    </nav>
    
    <div class="flex-shrink-0 px-2 py-4">
      <div class="flex items-center justify-between p-2 bg-gray-50 rounded-md">
        <div class="flex items-center min-w-0">
          <img
            class="h-8 w-8 rounded-full"
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || 'User')}&background=0ea5e9&color=fff`}
            alt="Avatar"
          />
          <div class="ml-3 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {user?.displayName || user?.email}
            </p>
          </div>
        </div>
        <button
          onclick={handleSignOut}
          class="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Sign out"
        >
          <LogOut class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</aside>

<!-- Mobile Bottom Navigation -->
<nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
  <div class="flex">
    {#each navItems as item}
      <a
        href={item.href}
        class="flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors
               {$page.url.pathname === item.href 
                 ? 'text-blue-600' 
                 : 'text-gray-500 hover:text-gray-700'}"
      >
        <item.icon class="h-6 w-6 mb-1" />
        {item.label}
      </a>
    {/each}
    <button
      onclick={handleSignOut}
      class="flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
    >
      <LogOut class="h-6 w-6 mb-1" />
      Sign Out
    </button>
  </div>
</nav>