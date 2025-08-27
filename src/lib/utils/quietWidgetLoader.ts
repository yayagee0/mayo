/**
 * Quiet Widget Lazy Loader
 * Dynamically loads quiet widgets only when requested to improve initial bundle size
 */

interface QuietWidgetLoader {
  [key: string]: () => Promise<any>;
}

// Dynamic loaders for quiet widgets - these are only resolved when called
export const quietWidgetLoaders: QuietWidgetLoader = {
  wall: () => import('../../components/cards/WallCard.svelte'),
  agePlayground: () => import('../../components/cards/AgePlaygroundCard.svelte'),
  professionCard: () => import('../../components/cards/ProfessionCard.svelte'),
  analytics: () => import('../../components/cards/AnalyticsCard.svelte'),
  scenarioDigest: () => import('../../components/cards/ScenarioDigestCard.svelte'),
  profileQuiz: () => import('../../components/cards/ProfileQuizCard.svelte'),
  islamicQA: () => import('../../components/cards/IslamicQACard.svelte'),
  islamicReflectionDigest: () => import('../../components/cards/IslamicReflectionDigestCard.svelte'),
  weeklyReflectionDigest: () => import('../../components/cards/WeeklyReflectionDigestCard.svelte'),
};

/**
 * Load a quiet widget component dynamically
 */
export async function loadQuietWidget(widgetId: string) {
  const loader = quietWidgetLoaders[widgetId];
  if (!loader) {
    throw new Error(`No quiet widget loader found for: ${widgetId}`);
  }

  try {
    const module = await loader();
    return module.default;
  } catch (error) {
    // Enhanced error logging for debugging MIME type and import issues
    if (error instanceof TypeError && error.message.includes('dynamically imported module')) {
      console.error(`Failed to load quiet widget ${widgetId}: Dynamic import blocked. This may be due to MIME type configuration issues on the server.`, {
        widgetId,
        error: error.message,
        suggestion: 'Check server MIME type configuration for .js files'
      });
    } else {
      console.error(`Failed to load quiet widget ${widgetId}:`, {
        widgetId,
        error: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

/**
 * Check if a widget has a quiet loader available
 */
export function hasQuietLoader(widgetId: string): boolean {
  return widgetId in quietWidgetLoaders;
}

/**
 * Get list of available quiet widget IDs
 */
export function getQuietWidgetIds(): string[] {
  return Object.keys(quietWidgetLoaders);
}