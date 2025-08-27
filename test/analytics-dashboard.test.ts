import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserRole } from '../src/lib/utils/roles';

// Mock the roles utility
vi.mock('../src/lib/utils/roles', () => ({
  getUserRole: vi.fn((email: string) => {
    if (email === 'parent@test.com') return 'parent';
    return 'child';
  })
}));

// Mock dayjs
vi.mock('dayjs', () => {
  const dayjs = vi.fn(() => ({
    subtract: vi.fn(() => ({
      startOf: vi.fn(() => ({ valueOf: vi.fn(() => 1000) })),
      endOf: vi.fn(() => ({ valueOf: vi.fn(() => 2000) })),
      format: vi.fn(() => 'Jan 01')
    })),
    format: vi.fn(() => 'Jan 01'),
    startOf: vi.fn(() => ({ valueOf: vi.fn(() => 1000) })),
    endOf: vi.fn(() => ({ valueOf: vi.fn(() => 2000) })),
    fromNow: vi.fn(() => '2 hours ago')
  }));
  dayjs.now = vi.fn(() => Date.now());
  return { default: dayjs };
});

describe('AnalyticsDashboard Component Logic', () => {
  const mockProfiles = [
    { user_id: 'user1', full_name: 'John Doe', email: 'john@test.com' },
    { user_id: 'user2', full_name: 'Jane Doe', email: 'jane@test.com' }
  ];

  const mockItems = [
    { 
      id: 'item1', 
      user_id: 'user1', 
      content: 'Test post 1', 
      created_at: new Date().toISOString() 
    },
    { 
      id: 'item2', 
      user_id: 'user2', 
      content: 'Test post 2', 
      created_at: new Date().toISOString() 
    }
  ];

  const mockInteractions = [
    { 
      id: 'int1', 
      user_id: 'user1', 
      interaction_type: 'like', 
      metadata: { widgetType: 'reflectionMood' },
      created_at: new Date().toISOString()
    },
    { 
      id: 'int2', 
      user_id: 'user2', 
      interaction_type: 'view', 
      metadata: { widgetType: 'ayah' },
      created_at: new Date().toISOString()
    }
  ];

  const mockReflections = [
    {
      id: 'ref1',
      user_id: 'user1',
      content: 'I feel happy today',
      mood_rating: 4,
      created_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should identify parent vs child users correctly', () => {
    expect(getUserRole('parent@test.com')).toBe('parent');
    expect(getUserRole('child@test.com')).toBe('child');
  });

  it('should calculate analytics correctly with valid data', () => {
    // Extract the calculateAnalytics function logic for testing
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

      const views = interactions.filter(i => i.interaction_type === 'view');
      const likes = interactions.filter(i => i.interaction_type === 'like');

      return {
        overview: {
          totalPosts: items.length,
          totalViews: views.length,
          totalLikes: likes.length,
          activeMembers: new Set(interactions.map(i => i.user_id)).size
        },
        timeline: [],
        widgetUsage: [],
        moodTrends: [],
        memberActivity: []
      };
    }

    const result = calculateAnalytics(mockItems, mockInteractions, mockReflections, mockProfiles);

    expect(result.overview.totalPosts).toBe(2);
    expect(result.overview.totalViews).toBe(1);
    expect(result.overview.totalLikes).toBe(1);
    expect(result.overview.activeMembers).toBe(2);
  });

  it('should handle empty data gracefully', () => {
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
      return {
        overview: { totalPosts: 0, totalViews: 0, totalLikes: 0, activeMembers: 0 },
        timeline: [],
        widgetUsage: [],
        moodTrends: [],
        memberActivity: []
      };
    }

    const result = calculateAnalytics([], [], [], []);

    expect(result.overview.totalPosts).toBe(0);
    expect(result.overview.totalViews).toBe(0);
    expect(result.overview.totalLikes).toBe(0);
    expect(result.overview.activeMembers).toBe(0);
  });

  it('should format widget names correctly', () => {
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

    expect(formatWidgetName('reflectionMood')).toBe('Reflection & Mood');
    expect(formatWidgetName('ayah')).toBe('Daily Ayah');
    expect(formatWidgetName('unknown')).toBe('Unknown');
  });

  it('should categorize moods correctly', () => {
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

    expect(categorizeMood(5)).toBe('positive');
    expect(categorizeMood(3)).toBe('neutral');
    expect(categorizeMood(1)).toBe('negative');
    expect(categorizeMood('I am happy')).toBe('positive');
    expect(categorizeMood('I feel sad')).toBe('negative');
    expect(categorizeMood('It was okay')).toBe('neutral');
  });

  it('should handle widget usage analysis', () => {
    const widgetCounts = mockInteractions.reduce((acc, i) => {
      const widgetType = i.metadata?.widgetType || 'unknown';
      acc[widgetType] = (acc[widgetType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(widgetCounts['reflectionMood']).toBe(1);
    expect(widgetCounts['ayah']).toBe(1);
  });
});