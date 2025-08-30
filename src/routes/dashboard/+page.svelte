<script lang="ts">
  import { onMount } from 'svelte';
  import { getWidgets, createWidget } from '$lib/firebase';
  import { FAMILY_ID } from '$lib/allowlist';
  import { auth } from '$lib/firebase';
  import { Heart, Users, Calendar, Star, Settings, Book } from 'lucide-svelte';

  let user = $state(null);
  let widgets = $state([]);
  let loading = $state(true);

  const sampleWidgets = [
    {
      key: 'birthday',
      title: 'Birthday Card',
      description: 'Upcoming family birthdays and celebrations',
      icon: Calendar,
      color: 'bg-pink-50 border-pink-200',
      iconColor: 'text-pink-600'
    },
    {
      key: 'profession',
      title: 'Profession Card',
      description: 'Family member career highlights and achievements',
      icon: Star,
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      key: 'reflection',
      title: 'Weekly Reflection',
      description: 'Share thoughts and reflections with family',
      icon: Heart,
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      key: 'islamic_qa',
      title: 'Islamic Q&A',
      description: 'Learn and grow in faith together',
      icon: Book,
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      key: 'family_poll',
      title: 'Family Decisions',
      description: 'Vote on family activities and decisions',
      icon: Users,
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-600'
    },
    {
      key: 'settings',
      title: 'Family Settings',
      description: 'Manage preferences and privacy settings',
      icon: Settings,
      color: 'bg-gray-50 border-gray-200',
      iconColor: 'text-gray-600'
    }
  ];

  onMount(async () => {
    user = auth.currentUser;
    
    try {
      // Load existing widgets
      widgets = await getWidgets(FAMILY_ID);
      
      // If no widgets exist, create sample ones
      if (widgets.length === 0) {
        await createSampleWidgets();
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
    } finally {
      loading = false;
    }
  });

  async function createSampleWidgets() {
    try {
      for (let i = 0; i < sampleWidgets.length; i++) {
        const widget = sampleWidgets[i];
        await createWidget({
          familyId: FAMILY_ID,
          key: widget.key,
          order: i,
          mode: 'active',
          enabled: true
        });
      }
      
      // Reload widgets
      widgets = await getWidgets(FAMILY_ID);
    } catch (error) {
      console.error('Error creating sample widgets:', error);
    }
  }

  function getWidgetDisplay(widgetKey: string) {
    return sampleWidgets.find(w => w.key === widgetKey) || {
      title: widgetKey,
      description: 'Widget description',
      icon: Settings,
      color: 'bg-gray-50 border-gray-200',
      iconColor: 'text-gray-600'
    };
  }
</script>

<svelte:head>
  <title>Dashboard - Mayo Family Platform</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="text-center">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Family Dashboard</h1>
    <p class="text-gray-600">Welcome back! Here's what's happening with your family.</p>
  </div>

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else}
    <!-- Widgets Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each widgets as widget}
        {@const display = getWidgetDisplay(widget.key)}
        <div class="card hover:shadow-xl transition-shadow cursor-pointer {display.color}">
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 rounded-lg bg-white/50 flex items-center justify-center">
                <display.icon class="h-6 w-6 {display.iconColor}" />
              </div>
            </div>
            
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">
                {display.title}
              </h3>
              <p class="text-sm text-gray-600 mb-3">
                {display.description}
              </p>
              
              <div class="flex items-center justify-between">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 text-gray-700">
                  {widget.enabled ? 'Active' : 'Disabled'}
                </span>
                <button class="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  View →
                </button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Quick Actions -->
    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a href="/feed" class="btn btn-primary">
          <Heart class="h-4 w-4 mr-2" />
          Share Update
        </a>
        <a href="/profile" class="btn btn-secondary">
          <Users class="h-4 w-4 mr-2" />
          Update Profile
        </a>
        <button class="btn btn-secondary">
          <Calendar class="h-4 w-4 mr-2" />
          Plan Activity
        </button>
      </div>
    </div>

    <!-- Family Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card text-center">
        <div class="text-2xl font-bold text-blue-600 mb-1">4</div>
        <p class="text-sm text-gray-600">Family Members</p>
      </div>
      <div class="card text-center">
        <div class="text-2xl font-bold text-green-600 mb-1">{widgets.length}</div>
        <p class="text-sm text-gray-600">Active Widgets</p>
      </div>
      <div class="card text-center">
        <div class="text-2xl font-bold text-purple-600 mb-1">∞</div>
        <p class="text-sm text-gray-600">Memories Shared</p>
      </div>
    </div>
  {/if}
</div>