<!--
  Comprehensive Analytics Dashboard - Parent-Only Detailed View  
  Enhanced analytics with charts and trends for family engagement
  Uses existing tables (items, interactions, reflections) per constraints
-->
<script lang="ts">
  import { BarChart3, TrendingUp, Calendar, Heart, MessageCircle, Users, Eye } from 'lucide-svelte';
  import type { Database } from '$lib/supabase';
  import { getUserRole } from '$lib/utils/roles';
  import dayjs from 'dayjs';

  interface Props {
    session: any;
    profiles: Database['public']['Tables']['profiles']['Row'][];
    items: Database['public']['Tables']['items']['Row'][];
    interactions: Database['public']['Tables']['interactions']['Row'][];
    reflections?: Database['public']['Tables']['reflections']['Row'][];
  }

  let { session, profiles, items, interactions, reflections = [] }: Props = $props();

  // Only show to parents
  let isParent = $derived(session?.user?.email ? 
    getUserRole(session.user.email as any) === 'parent' : false);

  // Calculate comprehensive analytics
  let analyticsData = $derived(calculateAnalytics(items, interactions, reflections, profiles));

  function calculateAnalytics(items: any[], interactions: any[], reflections: any[], profiles: any[]) {
    if (!items || !interactions || !profiles) {
      return {
        overview: { totalPosts: 0, totalViews: 0, totalLikes: 0, activeMembers: 0 },
        timeline: [],
        widgetUsage: [],
        moodTrends: [],
        memberActivity: []
      };
    }

    const now = Date.now();
    const last30Days = now - (30 * 24 * 60 * 60 * 1000);

    // Overview metrics
    const views = interactions.filter(i => i.interaction_type === 'view');
    const likes = interactions.filter(i => i.interaction_type === 'like');
    const recentActivity = interactions.filter(i => 
      new Date(i.created_at || '').getTime() > last30Days
    );
    const activeUserIds = new Set(recentActivity.map(i => i.user_id));

    const overview = {
      totalPosts: items.length,
      totalViews: views.length,
      totalLikes: likes.length,
      activeMembers: activeUserIds.size
    };

    // Daily timeline for last 14 days
    const timeline = [];
    for (let i = 13; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      const dayStart = date.startOf('day').valueOf();
      const dayEnd = date.endOf('day').valueOf();

      const dayItems = items.filter(item => {
        const itemTime = new Date(item.created_at || '').getTime();
        return itemTime >= dayStart && itemTime <= dayEnd;
      });

      const dayInteractions = interactions.filter(interaction => {
        const interactionTime = new Date(interaction.created_at || '').getTime();
        return interactionTime >= dayStart && interactionTime <= dayEnd;
      });

      timeline.push({
        date: date.format('MMM DD'),
        posts: dayItems.length,
        interactions: dayInteractions.length
      });
    }

    // Widget usage analysis
    const widgetCounts = interactions.reduce((acc, i) => {
      const widgetType = i.metadata?.widgetType || 'unknown';
      acc[widgetType] = (acc[widgetType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const widgetUsage = Object.entries(widgetCounts)
      .map(([widget, count]) => ({
        widget: formatWidgetName(widget),
        count: count as number
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 widgets

    // Mood trends from reflections
    const moodTrends = reflections.length > 0 ? 
      analyzeMoodTrends(reflections) : [];

    // Member activity analysis
    const memberActivity = profiles.map(profile => {
      const userItems = items.filter(item => item.user_id === profile.user_id);
      const userInteractions = interactions.filter(i => i.user_id === profile.user_id);
      
      return {
        name: profile.full_name || profile.email || 'Unknown',
        posts: userItems.length,
        interactions: userInteractions.length,
        lastActive: Math.max(
          ...userItems.map(i => new Date(i.created_at || '').getTime()),
          ...userInteractions.map(i => new Date(i.created_at || '').getTime())
        )
      };
    }).sort((a, b) => b.interactions - a.interactions);

    return {
      overview,
      timeline,
      widgetUsage,
      moodTrends,
      memberActivity
    };
  }

  function formatWidgetName(widgetId: string): string {
    const names: Record<string, string> = {
      'reflectionMood': 'Reflection & Mood',
      'ayah': 'Daily Ayah',
      'birthday': 'Birthday & Milestones',
      'quiz': 'Family Quiz',
      'scenario': 'What Would You Do?',
      'wall': 'Family Wall',
      'islamicQA': 'Islamic Q&A',
      'closingRitual': 'Daily Closure'
    };
    return names[widgetId] || widgetId.charAt(0).toUpperCase() + widgetId.slice(1);
  }

  function analyzeMoodTrends(reflections: any[]) {
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      const dayStart = date.startOf('day').valueOf();
      const dayEnd = date.endOf('day').valueOf();

      const dayReflections = reflections.filter(r => {
        const rTime = new Date(r.created_at || '').getTime();
        return rTime >= dayStart && rTime <= dayEnd;
      });

      // Simple mood categorization based on content
      const moods = dayReflections.map(r => categorizeMood(r.mood_rating || r.content || ''));
      const positive = moods.filter(m => m === 'positive').length;
      const neutral = moods.filter(m => m === 'neutral').length;
      const negative = moods.filter(m => m === 'negative').length;

      last7Days.push({
        date: date.format('ddd'),
        positive,
        neutral,
        negative,
        total: dayReflections.length
      });
    }

    return last7Days;
  }

  function categorizeMood(moodOrContent: string | number): 'positive' | 'neutral' | 'negative' {
    if (typeof moodOrContent === 'number') {
      if (moodOrContent >= 4) return 'positive';
      if (moodOrContent >= 3) return 'neutral';
      return 'negative';
    }
    
    const content = moodOrContent.toLowerCase();
    const positiveWords = ['happy', 'great', 'good', 'wonderful', 'amazing', 'love', 'joy'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated'];
    
    if (positiveWords.some(word => content.includes(word))) return 'positive';
    if (negativeWords.some(word => content.includes(word))) return 'negative';
    return 'neutral';
  }

  function formatLastActive(timestamp: number): string {
    if (!timestamp || timestamp === -Infinity) return 'Never';
    return dayjs(timestamp).fromNow();
  }
</script>

{#if isParent}
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
      <div class="flex items-center gap-3 mb-2">
        <BarChart3 class="w-8 h-8" />
        <h2 class="text-2xl font-bold">Family Analytics Dashboard</h2>
      </div>
      <p class="text-blue-100">
        Comprehensive insights into your family's engagement and activity patterns
      </p>
    </div>

    <!-- Overview Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="card text-center">
        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <MessageCircle class="w-6 h-6 text-green-600" />
        </div>
        <div class="text-3xl font-bold text-gray-900">{analyticsData.overview.totalPosts}</div>
        <div class="text-sm text-gray-600">Total Posts</div>
      </div>

      <div class="card text-center">
        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Eye class="w-6 h-6 text-blue-600" />
        </div>
        <div class="text-3xl font-bold text-gray-900">{analyticsData.overview.totalViews}</div>
        <div class="text-sm text-gray-600">Total Views</div>
      </div>

      <div class="card text-center">
        <div class="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Heart class="w-6 h-6 text-pink-600" />
        </div>
        <div class="text-3xl font-bold text-gray-900">{analyticsData.overview.totalLikes}</div>
        <div class="text-sm text-gray-600">Total Likes</div>
      </div>

      <div class="card text-center">
        <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Users class="w-6 h-6 text-purple-600" />
        </div>
        <div class="text-3xl font-bold text-gray-900">{analyticsData.overview.activeMembers}</div>
        <div class="text-sm text-gray-600">Active Members</div>
      </div>
    </div>

    <!-- Timeline Chart -->
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar class="w-5 h-5 text-blue-600" />
        Daily Activity (Last 14 Days)
      </h3>
      
      <div class="space-y-3">
        {#each analyticsData.timeline as day}
          <div class="flex items-center gap-4">
            <div class="w-16 text-sm text-gray-600 font-medium">{day.date}</div>
            <div class="flex-1 flex gap-2">
              <!-- Posts bar -->
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span class="text-xs text-gray-600">Posts: {day.posts}</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-green-500 transition-all duration-300"
                    style="width: {Math.max((day.posts / Math.max(...analyticsData.timeline.map(d => d.posts), 1)) * 100, day.posts > 0 ? 10 : 0)}%"
                  ></div>
                </div>
              </div>
              
              <!-- Interactions bar -->
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span class="text-xs text-gray-600">Interactions: {day.interactions}</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-blue-500 transition-all duration-300"
                    style="width: {Math.max((day.interactions / Math.max(...analyticsData.timeline.map(d => d.interactions), 1)) * 100, day.interactions > 0 ? 10 : 0)}%"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Widget Usage & Mood Trends -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Widget Usage -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-green-600" />
          Most Used Widgets
        </h3>
        
        <div class="space-y-3">
          {#each analyticsData.widgetUsage as widget, index}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <span class="text-sm font-medium text-gray-700">{widget.widget}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                    style="width: {Math.max((widget.count / Math.max(...analyticsData.widgetUsage.map(w => w.count), 1)) * 100, 10)}%"
                  ></div>
                </div>
                <span class="text-sm text-gray-600 w-8 text-right">{widget.count}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Mood Trends -->
      {#if analyticsData.moodTrends.length > 0}
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Heart class="w-5 h-5 text-pink-600" />
            Mood Trends (Last 7 Days)
          </h3>
          
          <div class="space-y-3">
            {#each analyticsData.moodTrends as day}
              <div class="flex items-center gap-4">
                <div class="w-12 text-xs text-gray-600 font-medium">{day.date}</div>
                <div class="flex-1 flex gap-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  {#if day.total > 0}
                    {#if day.positive > 0}
                      <div 
                        class="bg-green-500 h-full"
                        style="width: {(day.positive / day.total) * 100}%"
                      ></div>
                    {/if}
                    {#if day.neutral > 0}
                      <div 
                        class="bg-yellow-500 h-full"
                        style="width: {(day.neutral / day.total) * 100}%"
                      ></div>
                    {/if}
                    {#if day.negative > 0}
                      <div 
                        class="bg-red-500 h-full"
                        style="width: {(day.negative / day.total) * 100}%"
                      ></div>
                    {/if}
                  {/if}
                </div>
                <div class="text-xs text-gray-600 w-8 text-right">{day.total}</div>
              </div>
            {/each}
          </div>
          
          <div class="mt-4 flex items-center justify-center gap-4 text-xs">
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Positive</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Neutral</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Negative</span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Member Activity -->
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Users class="w-5 h-5 text-purple-600" />
        Member Activity
      </h3>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-2 px-4 font-medium text-gray-700">Member</th>
              <th class="text-center py-2 px-4 font-medium text-gray-700">Posts</th>
              <th class="text-center py-2 px-4 font-medium text-gray-700">Interactions</th>
              <th class="text-right py-2 px-4 font-medium text-gray-700">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {#each analyticsData.memberActivity as member}
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4 font-medium text-gray-900">{member.name}</td>
                <td class="py-3 px-4 text-center text-gray-600">{member.posts}</td>
                <td class="py-3 px-4 text-center text-gray-600">{member.interactions}</td>
                <td class="py-3 px-4 text-right text-gray-600">{formatLastActive(member.lastActive)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Privacy Notice -->
    <div class="card bg-blue-50 border-blue-200">
      <div class="flex items-start gap-3">
        <div class="text-blue-600 mt-0.5">🔒</div>
        <div class="text-sm text-blue-800">
          <strong>Privacy First:</strong> All analytics are computed locally using only your family's data. 
          No information is shared with external services or stored outside your family's private database.
        </div>
      </div>
    </div>
  </div>
{/if}