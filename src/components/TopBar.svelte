<script lang="ts">
  import { browser } from '$app/environment';
  import { profileStore } from '$lib/stores/profileStore';
  import { Home } from 'lucide-svelte';

  const affirmations = [
    "Your family bond grows stronger every day ✨",
    "Love and laughter fill your home 🏡",
    "Together, you create beautiful memories 💫"
  ];

  // Initialize with random affirmation immediately
  let selectedAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
  let greetingText = "";

  // Create greeting text from profile store
  $: if ($profileStore) {
    const names = $profileStore
      .map(profile => profile.display_name || profile.email.split('@')[0])
      .join(', ');
    greetingText = names ? `Salam ${names}` : "Salam Family";
  }
</script>

<header class="flex justify-between items-center p-4 rounded-2xl shadow-sm bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 flex-col md:flex-row">
  
  <!-- Left section: Icon + FamilyNest label -->
  <div class="flex items-center gap-3 text-center md:text-left">
    <Home class="w-8 h-8 text-gray-700" aria-hidden="true" />
    <h1 class="text-xl font-bold text-gray-900" style="font-size: max(16px, 1.25rem);">FamilyNest</h1>
  </div>

  <!-- Center section: Greeting text with names -->
  <div class="text-center md:text-center transition-opacity duration-500 ease-in">
    <p class="text-lg font-medium text-gray-900" style="font-size: max(16px, 1.125rem);">
      {greetingText}
    </p>
  </div>

  <!-- Right section: Random affirmation -->
  <div class="text-center md:text-right transition-opacity duration-500 ease-in">
    <p class="text-base text-gray-800" style="font-size: max(16px, 1rem);">
      {selectedAffirmation}
    </p>
  </div>

</header>
