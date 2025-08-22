<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { eventBus } from '$lib/eventBus';
	import { MessageCircle, Check, Shuffle } from 'lucide-svelte';

	interface Props extends WidgetProps {}

	let { session, profiles, items, interactions }: Props = $props();

	// Get user's role from profile
	let userProfile = $derived(profiles.find(p => p.email === session?.user?.email));
	let userRole = $derived(userProfile?.role || 'member');

	const promptsByRole = {
		parent: [
			"Ask your kids about their week",
			"Share a story from your childhood",
			"Plan a family activity for the weekend",
			"Express gratitude for something your family did today",
			"Ask each family member about their highs and lows"
		],
		child: [
			"Tell your parents about something you learned today",
			"Share what made you happy this week",
			"Ask your parents about their childhood",
			"Express appreciation for something your family does",
			"Share a goal you want to achieve"
		],
		member: [
			"Share something positive that happened today",
			"Express gratitude for a family member",
			"Ask someone about their interests",
			"Share a memory that makes you smile",
			"Encourage someone in the family"
		]
	};

	let rolePrompts = $derived(promptsByRole[userRole as keyof typeof promptsByRole] || promptsByRole.member);
	let todayPrompt = $derived(rolePrompts[new Date().getDay() % rolePrompts.length]);

	let responded = $state(false);

	function handlePromptResponse() {
		responded = true;
		eventBus.emit('widgetInteracted', {
			widgetType: 'prompt',
			action: 'responded',
			userId: session?.user?.id || ''
		});
	}
</script>

<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<MessageCircle class="w-6 h-6 text-blue-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">Today's Prompt</h3>
	</div>

	<div class="space-y-4">
		<div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
			<p class="text-primary-800 font-medium">
				{todayPrompt}
			</p>
		</div>

		{#if !responded}
			<div class="flex gap-2">
				<button
					onclick={handlePromptResponse}
					class="btn btn-primary text-sm flex items-center gap-2"
				>
					<Check class="w-4 h-4" aria-hidden="true" />
					I did this!
				</button>
				<button
					onclick={() => {
						// Generate a different prompt
						const newIndex = (new Date().getDay() + 1) % rolePrompts.length;
						todayPrompt = rolePrompts[newIndex];
					}}
					class="btn btn-secondary text-sm flex items-center gap-2"
				>
					<Shuffle class="w-4 h-4" aria-hidden="true" />
					Different prompt
				</button>
			</div>
		{:else}
			<div class="bg-green-50 border border-green-200 rounded-lg p-3">
				<div class="flex items-center gap-2">
					<Check class="w-5 h-5 text-green-600" aria-hidden="true" />
					<span class="text-green-700 text-sm font-medium">Great job! Keep connecting with your family.</span>
				</div>
			</div>
		{/if}

		<div class="text-xs text-gray-500">
			<span class="capitalize">{userRole}</span> prompt • Updates daily
		</div>
	</div>
</div>