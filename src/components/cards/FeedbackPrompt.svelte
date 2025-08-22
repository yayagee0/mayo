<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { eventBus } from '$lib/eventBus';
	import { supabase } from '$lib/supabase';
	import { Heart, Smile, Meh, Frown, Sparkles } from 'lucide-svelte';

	interface Props extends WidgetProps {}

	let { session, profiles, items, interactions }: Props = $props();

	// Get user's role from profile
	let userProfile = $derived(profiles.find(p => p.email === session?.user?.email));
	let userRole = $derived(userProfile?.role || 'member');

	// Sample reflection prompts
	const reflectionPrompts = {
		parent: [
			"How are you feeling about family time this week?",
			"What's one thing you'd like to improve as a parent?",
			"Share a proud moment from this week",
			"How connected do you feel with each family member?"
		],
		child: [
			"What made you happiest this week?",
			"How do you feel about your relationship with your parents?",
			"What's something you learned recently?",
			"What would make family time even better?"
		]
	};

	let isParent = $derived(userRole === 'parent');
	let isChild = $derived(userRole === 'child');
	let prompts = $derived(isParent ? reflectionPrompts.parent : reflectionPrompts.child);
	let currentPrompt = $derived(prompts[new Date().getDay() % prompts.length]);

	let selectedMood = $state('');
	let feedbackText = $state('');
	let submitted = $state(false);

	const moodOptions = [
		{ value: 'great', icon: Sparkles, label: 'Great', color: 'text-green-500' },
		{ value: 'good', icon: Smile, label: 'Good', color: 'text-blue-500' },
		{ value: 'okay', icon: Meh, label: 'Okay', color: 'text-yellow-500' },
		{ value: 'difficult', icon: Frown, label: 'Difficult', color: 'text-orange-500' },
		{ value: 'challenging', icon: Frown, label: 'Challenging', color: 'text-red-500' }
	];

	async function submitFeedback() {
		if (!selectedMood) return;

		try {
			const { error } = await supabase.from('items').insert({
				kind: 'poll',
				author_email: session?.user?.email || '',
				author_id: session?.user?.id,
				body: currentPrompt,
				data: {
					type: 'feedback',
					mood: selectedMood,
					feedback: feedbackText,
					role: userRole
				},
				visibility: 'family'
			});

			if (error) throw error;

			submitted = true;
			eventBus.emit('pollAnswered', {
				itemId: '',
				answerIndex: moodOptions.findIndex(m => m.value === selectedMood),
				userId: session?.user?.id || ''
			});
		} catch (error) {
			console.error('Error submitting feedback:', error);
		}
	}
</script>

<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<Heart class="w-6 h-6 text-pink-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">
			{isParent ? 'Parent' : 'Child'} Reflection
		</h3>
	</div>

	{#if !submitted}
		<div class="space-y-4">
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<p class="text-blue-800 font-medium text-sm">
					{currentPrompt}
				</p>
			</div>

			<div>
				<p class="text-sm font-medium text-gray-700 mb-3">How are you feeling?</p>
				<div class="grid grid-cols-5 gap-2">
					{#each moodOptions as mood}
						<button
							type="button"
							onclick={() => selectedMood = mood.value}
							class="flex flex-col items-center p-2 rounded-lg border transition-colors min-h-11 focus:outline-none focus:ring-2 focus:ring-primary-500"
							class:bg-primary-100={selectedMood === mood.value}
							class:border-primary-300={selectedMood === mood.value}
							class:bg-gray-50={selectedMood !== mood.value}
							class:border-gray-200={selectedMood !== mood.value}
							aria-label="Rate mood as {mood.label}"
						>
							{#if mood.value === 'great'}
								<Sparkles class="w-5 h-5 mb-1 {mood.color}" aria-hidden="true" />
							{:else if mood.value === 'good'}
								<Smile class="w-5 h-5 mb-1 {mood.color}" aria-hidden="true" />
							{:else if mood.value === 'okay'}
								<Meh class="w-5 h-5 mb-1 {mood.color}" aria-hidden="true" />
							{:else}
								<Frown class="w-5 h-5 mb-1 {mood.color}" aria-hidden="true" />
							{/if}
							<span class="text-xs font-medium">{mood.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<div>
				<label for="feedback" class="block text-sm font-medium text-gray-700 mb-2">
					Share more (optional):
				</label>
				<textarea
					id="feedback"
					bind:value={feedbackText}
					rows="3"
					class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					placeholder="Tell us more about how you're feeling..."
				></textarea>
			</div>

			<button
				type="button"
				onclick={submitFeedback}
				disabled={!selectedMood}
				class="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Share Reflection
			</button>
		</div>
	{:else}
		<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
			<Sparkles class="w-8 h-8 text-green-600 mx-auto mb-2" aria-hidden="true" />
			<p class="text-green-700 font-medium">Thank you for sharing!</p>
			<p class="text-green-600 text-sm mt-1">Your reflection helps strengthen our family bond.</p>
		</div>
	{/if}
</div>