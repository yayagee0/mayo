<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import dayjs from 'dayjs';
	import { Clock, Sparkles } from 'lucide-svelte';
	import { profileStore } from '$lib/stores/profileStore';

	interface Props extends WidgetProps {}

	let { session, items, interactions }: Props = $props();

	// Subscribe to profileStore instead of using props
	let profiles = $derived($profileStore);

	let familyMembers = $derived(profiles.filter(p => p?.dob));

	let selectedProfile = $state('');
	let calculatedAge = $state('');

	function calculateAge() {
		if (!selectedProfile) return;
		
		const profile = profiles.find(p => p.user_id === selectedProfile);
		if (!profile?.dob) return;

		const birthDate = dayjs(profile.dob);
		const now = dayjs();
		
		const years = now.diff(birthDate, 'year');
		const months = now.diff(birthDate.add(years, 'year'), 'month');
		const days = now.diff(birthDate.add(years, 'year').add(months, 'month'), 'day');
		const hours = now.diff(birthDate.add(years, 'year').add(months, 'month').add(days, 'day'), 'hour');
		const minutes = now.diff(birthDate.add(years, 'year').add(months, 'month').add(days, 'day').add(hours, 'hour'), 'minute');

		calculatedAge = `${years} years, ${months} months, ${days} days, ${hours} hours, and ${minutes} minutes old`;
	}

	$effect(() => {
		if (selectedProfile) {
			calculateAge();
		}
	});
</script>

<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<Clock class="w-6 h-6 text-purple-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">How Old Calculator</h3>
	</div>

	<div class="space-y-4">
		{#if familyMembers.length === 0}
			<div class="text-center py-8">
				<Clock class="w-12 h-12 text-gray-300 mx-auto mb-2" aria-hidden="true" />
				<p class="text-gray-500 text-sm">No family members with birthdays recorded.</p>
			</div>
		{:else}
			<div>
				<label for="family-member" class="block text-sm font-medium text-gray-700 mb-2">
					Select family member:
				</label>
				<select
					id="family-member"
					bind:value={selectedProfile}
					class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
				>
					<option value="">Choose someone...</option>
					{#each familyMembers as member (member.user_id)}
						<option value={member.user_id}>
							{member.display_name || member.email.split('@')[0]}
						</option>
					{/each}
				</select>
			</div>

			{#if calculatedAge}
				<div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
					<div class="text-center">
						<p class="text-sm text-primary-600 mb-1">
							{profiles.find(p => p.user_id === selectedProfile)?.display_name || 'This person'} is
						</p>
						<p class="text-primary-800 font-semibold">
							{calculatedAge}
						</p>
					</div>
				</div>
			{/if}

			<div class="bg-gray-50 rounded-lg p-3">
				<div class="flex items-center justify-center gap-2">
					<Sparkles class="w-4 h-4 text-yellow-500" aria-hidden="true" />
					<p class="text-xs text-gray-600 text-center">
						Ages are calculated in real-time down to the minute!
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>