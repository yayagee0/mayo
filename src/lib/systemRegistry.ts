import type { WidgetRegistry, WidgetConfig } from './types/widget'

// Lazy loading functions for widgets
const loadBirthdayCard = () => import('../components/cards/BirthdayCard.svelte');
const loadAyahCard = () => import('../components/cards/AyahCard.svelte');
const loadPromptCard = () => import('../components/cards/PromptCard.svelte');
const loadFeedbackPrompt = () => import('../components/cards/FeedbackPrompt.svelte');
const loadWallCard = () => import('../components/cards/WallCard.svelte');
const loadAgePlaygroundCard = () => import('../components/cards/AgePlaygroundCard.svelte');
const loadProfileQuizCard = () => import('../components/cards/ProfileQuizCard.svelte');
const loadGuessFamilyCard = () => import('../components/cards/GuessFamilyCard.svelte');
const loadScenarioCard = () => import('../components/cards/ScenarioCard.svelte');
const loadScenarioDigestCard = () => import('../components/cards/ScenarioDigestCard.svelte');

export const systemRegistry: WidgetRegistry = {
  birthday: {
    id: 'birthday',
    name: 'Birthday Card',
    component: loadBirthdayCard,
    priority: 100,
    enabled: true
  },
  wall: {
    id: 'wall',
    name: 'Wall Card',
    component: loadWallCard,
    priority: 95,
    enabled: true
  },
  agePlayground: {
    id: 'agePlayground',
    name: 'Age Playground',
    component: loadAgePlaygroundCard,
    priority: 88,
    enabled: true // Feature flag - can be set to false to disable
  },
  profileQuiz: {
    id: 'profileQuiz',
    name: 'Set Your Fun Profile',
    component: loadProfileQuizCard,
    priority: 87,
    enabled: true
  },
  guessFamily: {
    id: 'guessFamily',
    name: 'Guess Family Answers',
    component: loadGuessFamilyCard,
    priority: 86,
    enabled: true
  },
  scenario: {
    id: 'scenario',
    name: 'What Would You Do?',
    component: loadScenarioCard,
    priority: 85,
    enabled: true
  },
  ayah: {
    id: 'ayah',
    name: 'Daily Ayah',
    component: loadAyahCard,
    priority: 84,
    enabled: true
  },
  prompt: {
    id: 'prompt',
    name: 'Role-aware Prompts',
    component: loadPromptCard,
    priority: 80,
    enabled: true
  },
  feedback: {
    id: 'feedback',
    name: 'Feedback Prompt',
    component: loadFeedbackPrompt,
    priority: 75,
    enabled: true
  },
  scenarioDigest: {
    id: 'scenarioDigest',
    name: 'Scenario Reflection Digest',
    component: loadScenarioDigestCard,
    priority: 70,
    enabled: true
  }
}