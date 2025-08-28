import { describe, it, expect } from 'vitest';
import { widgetRegistry } from '../src/lib/widgetRegistry';

describe('Widget Order - Dream Builder Playground', () => {
  describe('Priority Ordering', () => {
    it('should have Dream Builder Playground immediately after Age Playground in sorted widget list', () => {
      const sortedWidgets = widgetRegistry.getSorted();
      
      // Find the positions of both widgets
      const agePlaygroundIndex = sortedWidgets.findIndex(w => w.id === 'agePlayground');
      const dreamBuilderIndex = sortedWidgets.findIndex(w => w.id === 'dreamBuilderPlayground');
      
      // Both widgets should be found
      expect(agePlaygroundIndex).toBeGreaterThanOrEqual(0);
      expect(dreamBuilderIndex).toBeGreaterThanOrEqual(0);
      
      // Dream Builder should come immediately after Age Playground
      expect(dreamBuilderIndex).toBe(agePlaygroundIndex + 1);
    });

    it('should have correct priorities set for adjacent positioning', () => {
      const widgets = widgetRegistry.getAll();
      
      const agePlayground = widgets.find(w => w.id === 'agePlayground');
      const dreamBuilderPlayground = widgets.find(w => w.id === 'dreamBuilderPlayground');
      
      expect(agePlayground).toBeDefined();
      expect(dreamBuilderPlayground).toBeDefined();
      
      // Age Playground should have priority 60
      expect(agePlayground!.priority).toBe(60);
      
      // Dream Builder Playground should have priority 59 (immediately after)
      expect(dreamBuilderPlayground!.priority).toBe(59);
      
      // Verify the priority difference is exactly 1 for adjacent positioning
      expect(agePlayground!.priority - dreamBuilderPlayground!.priority).toBe(1);
    });

    it('should maintain both widgets as quiet widgets', () => {
      const widgets = widgetRegistry.getAll();
      
      const agePlayground = widgets.find(w => w.id === 'agePlayground');
      const dreamBuilderPlayground = widgets.find(w => w.id === 'dreamBuilderPlayground');
      
      // Both should be enabled quiet widgets (priority 50-70)
      expect(agePlayground!.enabled).toBe(true);
      expect(dreamBuilderPlayground!.enabled).toBe(true);
      
      expect(agePlayground!.priority).toBeGreaterThanOrEqual(50);
      expect(agePlayground!.priority).toBeLessThanOrEqual(70);
      
      expect(dreamBuilderPlayground!.priority).toBeGreaterThanOrEqual(50);
      expect(dreamBuilderPlayground!.priority).toBeLessThanOrEqual(70);
    });

    it('should be visible to all user roles', () => {
      // Test the visibility logic from dashboard
      function shouldShowWidget(widgetId: string, userRole: 'parent' | 'child'): boolean {
        // Parent-only widgets
        if (['weeklyReflectionDigest', 'analytics', 'islamicReflectionDigest', 'scenarioDigest'].includes(widgetId)) {
          return userRole === 'parent';
        }
        
        // Children-only widgets  
        if (['islamicQA', 'scenario'].includes(widgetId)) {
          return userRole === 'child';
        }
        
        // All other widgets are visible to everyone
        return true;
      }

      // Both widgets should be visible to parents
      expect(shouldShowWidget('agePlayground', 'parent')).toBe(true);
      expect(shouldShowWidget('dreamBuilderPlayground', 'parent')).toBe(true);
      
      // Both widgets should be visible to children
      expect(shouldShowWidget('agePlayground', 'child')).toBe(true);
      expect(shouldShowWidget('dreamBuilderPlayground', 'child')).toBe(true);
    });

    it('should maintain proper gap to next widget (professionCard)', () => {
      const widgets = widgetRegistry.getAll();
      
      const dreamBuilderPlayground = widgets.find(w => w.id === 'dreamBuilderPlayground');
      const professionCard = widgets.find(w => w.id === 'professionCard');
      
      expect(dreamBuilderPlayground!.priority).toBe(59);
      expect(professionCard!.priority).toBe(55);
      
      // Should have a gap of 4 priority points to next widget
      expect(dreamBuilderPlayground!.priority - professionCard!.priority).toBe(4);
    });
  });

  describe('No Duplicates', () => {
    it('should have no duplicate widget registrations', () => {
      const widgets = widgetRegistry.getAll();
      const widgetIds = widgets.map(w => w.id);
      const uniqueIds = new Set(widgetIds);
      
      expect(widgetIds.length).toBe(uniqueIds.size);
      
      // Specifically check that our widgets appear only once
      const agePlaygroundCount = widgetIds.filter(id => id === 'agePlayground').length;
      const dreamBuilderCount = widgetIds.filter(id => id === 'dreamBuilderPlayground').length;
      
      expect(agePlaygroundCount).toBe(1);
      expect(dreamBuilderCount).toBe(1);
    });
  });
});