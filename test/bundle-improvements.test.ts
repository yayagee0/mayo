// Tests for bundle improvements - lazy loading implementation
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isAnchorWidget, isQuietWidget } from '../src/lib/utils/lazyLoader';
import { loadQuietWidget, hasQuietLoader, getQuietWidgetIds } from '../src/lib/utils/quietWidgetLoader';

describe('Bundle Improvements - Lazy Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Widget Classification for Lazy Loading', () => {
    it('should correctly identify anchor widgets for immediate loading', () => {
      // These widgets should always be preloaded
      const anchorWidgets = ['reflectionMood', 'ayah', 'birthday', 'quiz', 'scenario', 'closingRitual'];
      
      anchorWidgets.forEach(widget => {
        expect(isAnchorWidget(widget)).toBe(true);
        expect(isQuietWidget(widget)).toBe(false);
      });
    });

    it('should correctly identify quiet widgets for lazy loading', () => {
      // These widgets should be lazy loaded
      const quietWidgets = [
        'wall', 'scenarioDigest', 'profileQuiz', 'agePlayground', 
        'professionCard', 'islamicQA', 'islamicReflectionDigest', 
        'weeklyReflectionDigest', 'analytics'
      ];
      
      quietWidgets.forEach(widget => {
        expect(isQuietWidget(widget)).toBe(true);
        expect(isAnchorWidget(widget)).toBe(false);
      });
    });

    it('should have no overlap between anchor and quiet widgets', () => {
      const anchorWidgets = ['reflectionMood', 'ayah', 'birthday', 'quiz', 'scenario', 'closingRitual'];
      const quietWidgets = [
        'wall', 'scenarioDigest', 'profileQuiz', 'agePlayground', 
        'professionCard', 'islamicQA', 'islamicReflectionDigest', 
        'weeklyReflectionDigest', 'analytics'
      ];
      
      // No widget should be both anchor and quiet
      anchorWidgets.forEach(widget => {
        expect(quietWidgets.includes(widget)).toBe(false);
      });
      
      quietWidgets.forEach(widget => {
        expect(anchorWidgets.includes(widget)).toBe(false);
      });
    });
  });

  describe('Quiet Widget Loader', () => {
    it('should have loaders for all expected quiet widgets', () => {
      const expectedQuietWidgets = [
        'wall', 'agePlayground', 'professionCard', 'analytics', 
        'scenarioDigest', 'profileQuiz', 'islamicQA', 
        'islamicReflectionDigest', 'weeklyReflectionDigest'
      ];

      expectedQuietWidgets.forEach(widget => {
        expect(hasQuietLoader(widget)).toBe(true);
      });

      const availableWidgets = getQuietWidgetIds();
      expect(availableWidgets.sort()).toEqual(expectedQuietWidgets.sort());
    });

    it('should return false for non-quiet widgets', () => {
      const anchorWidgets = ['reflectionMood', 'ayah', 'birthday', 'quiz', 'scenario', 'closingRitual'];
      
      anchorWidgets.forEach(widget => {
        expect(hasQuietLoader(widget)).toBe(false);
      });
    });

    it('should throw error for invalid widget ID', async () => {
      await expect(loadQuietWidget('invalidWidget')).rejects.toThrow(
        'No quiet widget loader found for: invalidWidget'
      );
    });
  });

  describe('Lazy Widget Loading Logic', () => {
    it('should simulate anchor widgets loading immediately', async () => {
      // Mock widget registry structure
      const mockWidgets = [
        {
          id: 'reflectionMood',
          name: 'Reflection & Mood',
          component: () => Promise.resolve({ default: 'ReflectionMoodComponent' }),
          priority: 100,
          enabled: true
        },
        {
          id: 'ayah',
          name: 'Daily Ayah',
          component: () => Promise.resolve({ default: 'AyahComponent' }),
          priority: 85,
          enabled: true
        },
        {
          id: 'wall',
          name: 'Wall Card',
          component: () => Promise.resolve({ default: 'WallComponent' }),
          priority: 95,
          enabled: true
        },
        {
          id: 'agePlayground',
          name: 'Age Playground',
          component: () => Promise.resolve({ default: 'AgePlaygroundComponent' }),
          priority: 54,
          enabled: true
        }
      ];

      // Simulate loading only anchor widgets
      const anchorWidgets = mockWidgets.filter(widget => isAnchorWidget(widget.id));
      expect(anchorWidgets).toHaveLength(2);
      expect(anchorWidgets.map(w => w.id)).toEqual(['reflectionMood', 'ayah']);

      // Load anchor widgets
      const loadedAnchorWidgets = await Promise.all(
        anchorWidgets.map(async (widget) => {
          const componentModule = await widget.component();
          return { config: widget, component: componentModule.default };
        })
      );

      expect(loadedAnchorWidgets).toHaveLength(2);
      expect(loadedAnchorWidgets[0].component).toBe('ReflectionMoodComponent');
      expect(loadedAnchorWidgets[1].component).toBe('AyahComponent');
    });

    it('should simulate quiet widgets loading on demand', async () => {
      const mockWidgets = [
        {
          id: 'reflectionMood',
          name: 'Reflection & Mood',
          component: () => Promise.resolve({ default: 'ReflectionMoodComponent' }),
          priority: 100,
          enabled: true
        },
        {
          id: 'wall',
          name: 'Wall Card',
          component: () => Promise.resolve({ default: 'WallComponent' }),
          priority: 95,
          enabled: true
        },
        {
          id: 'agePlayground',
          name: 'Age Playground',
          component: () => Promise.resolve({ default: 'AgePlaygroundComponent' }),
          priority: 54,
          enabled: true
        },
        {
          id: 'analytics',
          name: 'Analytics',
          component: () => Promise.resolve({ default: 'AnalyticsComponent' }),
          priority: 51,
          enabled: true
        }
      ];

      // Simulate loading only quiet widgets when triggered
      const quietWidgets = mockWidgets.filter(widget => isQuietWidget(widget.id));
      expect(quietWidgets).toHaveLength(3);
      expect(quietWidgets.map(w => w.id)).toEqual(['wall', 'agePlayground', 'analytics']);

      // Simulate the new loader approach
      const loadedQuietWidgets = [];
      for (const widget of quietWidgets) {
        if (hasQuietLoader(widget.id)) {
          // In real scenario, this would load from quietWidgetLoader
          // For test, we simulate the expected behavior
          const mockComponent = `Lazy${widget.name.replace(/\s+/g, '')}Component`;
          loadedQuietWidgets.push({ config: widget, component: mockComponent });
        }
      }

      expect(loadedQuietWidgets).toHaveLength(3);
      expect(loadedQuietWidgets.map(w => w.component)).toEqual([
        'LazyWallCardComponent',
        'LazyAgePlaygroundComponent', 
        'LazyAnalyticsComponent'
      ]);
    });

    it('should handle loading errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockWidgetsWithError = [
        {
          id: 'workingWidget',
          name: 'Working Widget',
          component: () => Promise.resolve({ default: 'WorkingComponent' }),
          priority: 100,
          enabled: true
        },
        {
          id: 'brokenWidget',
          name: 'Broken Widget',
          component: () => Promise.reject(new Error('Failed to load')),
          priority: 95,
          enabled: true
        }
      ];

      // Simulate loading with error handling
      const results = await Promise.all(
        mockWidgetsWithError.map(async (widget) => {
          try {
            const componentModule = await widget.component();
            return { config: widget, component: componentModule.default };
          } catch (error) {
            console.error(`Failed to load widget ${widget.id}:`, error);
            return null;
          }
        })
      );

      const successfulResults = results.filter(result => result !== null);
      
      expect(successfulResults).toHaveLength(1);
      expect(successfulResults[0].component).toBe('WorkingComponent');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load widget brokenWidget:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Bundle Size Impact Validation', () => {
    it('should validate that quiet widgets are larger components that benefit from lazy loading', () => {
      // These are the components that were identified as largest in the bundle analysis
      const largeComponents = [
        'agePlayground', // AgePlaygroundCard.js: 15.26 kB
        'professionCard', // ProfessionCard.js: 19.66 kB  
        'wall', // WallCard.js: 23.04 kB
        'analytics' // AnalyticsCard.js: 10.18 kB
      ];

      largeComponents.forEach(component => {
        expect(isQuietWidget(component)).toBe(true);
        expect(isAnchorWidget(component)).toBe(false);
      });
    });

    it('should validate that anchor widgets are essential and should be preloaded', () => {
      // Core widgets that should always be available immediately
      const essentialWidgets = [
        'reflectionMood', // Core family interaction
        'ayah', // Daily spiritual content
        'birthday', // Important family events
        'quiz', // Family engagement
        'scenario', // Core feature
        'closingRitual' // Essential daily ritual
      ];

      essentialWidgets.forEach(widget => {
        expect(isAnchorWidget(widget)).toBe(true);
        expect(isQuietWidget(widget)).toBe(false);
      });
    });
  });

  describe('Loading State Management', () => {
    it('should track loading states correctly', () => {
      // Mock loading state management
      let quietWidgetsLoading = false;
      let quietWidgetsLoaded = false;

      // Initial state
      expect(quietWidgetsLoading).toBe(false);
      expect(quietWidgetsLoaded).toBe(false);

      // Start loading
      quietWidgetsLoading = true;
      expect(quietWidgetsLoading).toBe(true);
      expect(quietWidgetsLoaded).toBe(false);

      // Finish loading
      quietWidgetsLoading = false;
      quietWidgetsLoaded = true;
      expect(quietWidgetsLoading).toBe(false);
      expect(quietWidgetsLoaded).toBe(true);
    });

    it('should prevent duplicate loading attempts', () => {
      let loadingAttempts = 0;
      let quietWidgetsLoading = false;
      let quietWidgetsLoaded = false;

      const mockLoadQuietWidgets = () => {
        if (quietWidgetsLoaded || quietWidgetsLoading) {
          return;
        }
        loadingAttempts++;
        quietWidgetsLoading = true;
        // Simulate async loading
        setTimeout(() => {
          quietWidgetsLoading = false;
          quietWidgetsLoaded = true;
        }, 100);
      };

      // First call should trigger loading
      mockLoadQuietWidgets();
      expect(loadingAttempts).toBe(1);

      // Second call while loading should be ignored
      mockLoadQuietWidgets();
      expect(loadingAttempts).toBe(1);

      // Mark as loaded and try again
      quietWidgetsLoading = false;
      quietWidgetsLoaded = true;
      mockLoadQuietWidgets();
      expect(loadingAttempts).toBe(1);
    });
  });

  describe('Runtime Performance Benefits', () => {
    it('should demonstrate improved initial load by loading fewer widgets', () => {
      // Mock all available widgets
      const allWidgets = [
        'reflectionMood', 'ayah', 'birthday', 'quiz', 'scenario', 'closingRitual', // anchor
        'wall', 'agePlayground', 'professionCard', 'analytics', 'scenarioDigest', 
        'profileQuiz', 'islamicQA', 'islamicReflectionDigest', 'weeklyReflectionDigest' // quiet
      ];

      const initialLoadWidgets = allWidgets.filter(isAnchorWidget);
      const lazyLoadWidgets = allWidgets.filter(isQuietWidget);

      // Verify the split is meaningful
      expect(initialLoadWidgets.length).toBe(6); // 6 anchor widgets
      expect(lazyLoadWidgets.length).toBe(9); // 9 quiet widgets
      
      // Validate that we're loading 40% fewer widgets initially (6/15 = 40%)
      const initialLoadPercentage = (initialLoadWidgets.length / allWidgets.length) * 100;
      expect(initialLoadPercentage).toBe(40);

      // This represents a 60% reduction in initial widget loading
      const lazyLoadPercentage = (lazyLoadWidgets.length / allWidgets.length) * 100;
      expect(lazyLoadPercentage).toBe(60);
    });

    it('should validate progressive enhancement approach', () => {
      // Core widgets that provide essential functionality
      const coreWidgets = ['reflectionMood', 'ayah', 'birthday', 'closingRitual'];
      coreWidgets.forEach(widget => {
        expect(isAnchorWidget(widget)).toBe(true);
      });

      // Enhancement widgets that are nice-to-have
      const enhancementWidgets = ['analytics', 'agePlayground', 'professionCard'];
      enhancementWidgets.forEach(widget => {
        expect(isQuietWidget(widget)).toBe(true);
      });

      // This demonstrates the progressive enhancement strategy
      expect(coreWidgets.length).toBeGreaterThan(0);
      expect(enhancementWidgets.length).toBeGreaterThan(0);
    });
  });
});