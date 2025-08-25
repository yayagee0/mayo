// src/lib/stores/composerStore.ts
import { writable } from 'svelte/store';

/**
 * Store to manage the Quick Post composer modal state
 * This allows components to open/close the composer and react to navigation changes
 */
export const composerStore = writable<boolean>(false);

export function openComposer() {
  composerStore.set(true);
}

export function closeComposer() {
  composerStore.set(false);
}