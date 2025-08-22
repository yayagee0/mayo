import type { WidgetRegistry } from './types/widget'
import BirthdayCard from '../components/cards/BirthdayCard.svelte'
import AyahCard from '../components/cards/AyahCard.svelte'
import PromptCard from '../components/cards/PromptCard.svelte'
import FeedbackPrompt from '../components/cards/FeedbackPrompt.svelte'
import HowOldCard from '../components/cards/HowOldCard.svelte'
import WallCard from '../components/cards/WallCard.svelte'

export const systemRegistry: WidgetRegistry = {
  birthday: {
    id: 'birthday',
    name: 'Birthday Card',
    component: BirthdayCard,
    priority: 100,
    enabled: true
  },
  howOld: {
    id: 'howOld',
    name: 'How Old Calculator',
    component: HowOldCard,
    priority: 90,
    enabled: true
  },
  wall: {
    id: 'wall',
    name: 'Wall Card',
    component: WallCard,
    priority: 95,
    enabled: true
  },
  ayah: {
    id: 'ayah',
    name: 'Daily Ayah',
    component: AyahCard,
    priority: 85,
    enabled: true
  },
  prompt: {
    id: 'prompt',
    name: 'Role-aware Prompts',
    component: PromptCard,
    priority: 80,
    enabled: true
  },
  feedback: {
    id: 'feedback',
    name: 'Feedback Prompt',
    component: FeedbackPrompt,
    priority: 75,
    enabled: true
  }
}