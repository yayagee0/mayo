<!--
  Analytics Card Component - Parent-Only Dashboard Widget
  Shows family engagement stats using existing interactions table
  Private, family-only analytics with no external services
-->
<script lang="ts">
  import { BarChart3, Eye, Heart, MessageCircle, Users } from 'lucide-svelte'
  import type { WidgetProps } from '$lib/types/widget'
  import { getUserRole } from '$lib/utils/roles'

  export let session: WidgetProps['session']
  export let profiles: WidgetProps['profiles'] 
  export let items: WidgetProps['items']
  export let interactions: WidgetProps['interactions']

  // Only show to parents and if analytics is enabled
  $: isParent = session?.user?.email ? 
    getUserRole(session.user.email as any) === 'parent' : false

  // Check if analytics is enabled in settings
  $: analyticsEnabled = checkAnalyticsEnabled()

  function checkAnalyticsEnabled(): boolean {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('analyticsEnabled')
      return saved !== null ? JSON.parse(saved) : true // Default to enabled
    }
    return true
  }

  $: shouldShowAnalytics = isParent && analyticsEnabled

  // Calculate engagement metrics from existing data
  $: engagementStats = calculateEngagementStats(items, interactions, profiles)

  function calculateEngagementStats(items: any[], interactions: any[], profiles: any[]) {
    if (!items || !interactions || !profiles) {
      return {
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        activeMembers: 0,
        weeklyActivity: 0,
        topWidget: 'None'
      }
    }

    const now = Date.now()
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000)

    // Count different types of interactions
    const views = interactions.filter(i => i.interaction_type === 'view')
    const likes = interactions.filter(i => i.interaction_type === 'like')
    const comments = interactions.filter(i => i.interaction_type === 'comment')
    
    // Recent activity (last week)
    const recentInteractions = interactions.filter(i => 
      new Date(i.created_at || '').getTime() > weekAgo
    )

    // Active members (interacted in last week)
    const activeUserIds = new Set(recentInteractions.map(i => i.user_id))

    // Top widget by interactions
    const widgetCounts = interactions.reduce((acc, i) => {
      if (i.metadata?.widgetType) {
        acc[i.metadata.widgetType] = (acc[i.metadata.widgetType] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const topWidget = Object.entries(widgetCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'None'

    return {
      totalPosts: items.length,
      totalViews: views.length,
      totalLikes: likes.length,
      totalComments: comments.length,
      activeMembers: activeUserIds.size,
      weeklyActivity: recentInteractions.length,
      topWidget: formatWidgetName(topWidget)
    }
  }

  function formatWidgetName(widgetId: string): string {
    const names: Record<string, string> = {
      'reflectionMood': 'Reflection & Mood',
      'ayah': 'Daily Ayah',
      'birthday': 'Birthday & Milestones',
      'quiz': 'Family Quiz',
      'scenario': 'What Would You Do?',
      'wall': 'Family Wall',
      'islamicQA': 'Islamic Q&A'
    }
    return names[widgetId] || widgetId
  }
</script>

{#if shouldShowAnalytics}
  <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <BarChart3 class="w-5 h-5 text-blue-600" aria-hidden="true" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Family Insights</h3>
        <p class="text-sm text-gray-600">Private engagement overview</p>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <!-- Total Posts -->
      <div class="bg-white rounded-lg p-4 text-center">
        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <MessageCircle class="w-4 h-4 text-green-600" aria-hidden="true" />
        </div>
        <div class="text-2xl font-bold text-gray-900">{engagementStats.totalPosts}</div>
        <div class="text-xs text-gray-500">Posts</div>
      </div>

      <!-- Total Views -->
      <div class="bg-white rounded-lg p-4 text-center">
        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Eye class="w-4 h-4 text-blue-600" aria-hidden="true" />
        </div>
        <div class="text-2xl font-bold text-gray-900">{engagementStats.totalViews}</div>
        <div class="text-xs text-gray-500">Views</div>
      </div>

      <!-- Total Likes -->
      <div class="bg-white rounded-lg p-4 text-center">
        <div class="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Heart class="w-4 h-4 text-pink-600" aria-hidden="true" />
        </div>
        <div class="text-2xl font-bold text-gray-900">{engagementStats.totalLikes}</div>
        <div class="text-xs text-gray-500">Likes</div>
      </div>

      <!-- Active Members -->
      <div class="bg-white rounded-lg p-4 text-center">
        <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Users class="w-4 h-4 text-purple-600" aria-hidden="true" />
        </div>
        <div class="text-2xl font-bold text-gray-900">{engagementStats.activeMembers}</div>
        <div class="text-xs text-gray-500">Active</div>
      </div>
    </div>

    <div class="bg-white rounded-lg p-4">
      <h4 class="text-sm font-medium text-gray-900 mb-3">This Week</h4>
      <div class="flex justify-between items-center">
        <div>
          <div class="text-lg font-semibold text-gray-900">
            {engagementStats.weeklyActivity} interactions
          </div>
          <div class="text-sm text-gray-600">
            Top widget: {engagementStats.topWidget}
          </div>
        </div>
        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <BarChart3 class="w-6 h-6 text-white" aria-hidden="true" />
        </div>
      </div>
    </div>

    <div class="mt-4 text-xs text-gray-500 text-center">
      📊 Private family analytics • No external tracking
    </div>
  </div>
{/if}