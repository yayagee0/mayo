<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { Gamepad2, Users, ArrowRight, Clock, Plus, Minus } from 'lucide-svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import { profileStore } from '$lib/stores/profileStore';
	import { 
		calculateFamilyAgesWithNegatives, 
		getFamilyMemberDisplayNames, 
		hasRequiredDobs, 
		getAllFamilyProfiles 
	} from '$lib/utils/age';

	interface Props extends WidgetProps {}

	let { session }: Props = $props();

	// Subscribe to profileStore
	let profiles = $derived($profileStore);
	
	// Get all family profiles for the selector (not just children)
	let familyProfiles = $derived(getAllFamilyProfiles(profiles));
	
	// Check if we have enough DOB data
	let hasEnoughData = $derived(hasRequiredDobs(profiles));
	
	// Get display names
	let displayNames = $derived(getFamilyMemberDisplayNames(profiles));
	
	// State for the playground
	let selectedBaseMember = $state('');
	let targetAge = $state(10);
	let familyAges = $state<{ [email: string]: number }>({});
	let showExactOffsets = $state(false); // Toggle for showing negative ages vs "Not born yet"

	// Calculate family ages when inputs change
	$effect(() => {
		if (selectedBaseMember && targetAge && profiles.length > 0) {
			familyAges = calculateFamilyAgesWithNegatives(profiles, selectedBaseMember, targetAge);
		} else {
			familyAges = {};
		}
	});

	// Calculate max age based on user
	let maxAge = $derived(() => {
		// Ghassan can reach age 70, others limited to 18
		if (session?.user?.email === 'nilezat@gmail.com') {
			return 70;
		}
		return 18;
	});

	let maxAgeLabel = $derived(() => {
		return maxAge() === 70 ? '70 years' : '18 years';
	});

	// Auto-select first family member if none selected
	$effect(() => {
		if (familyProfiles.length > 0 && !selectedBaseMember) {
			selectedBaseMember = familyProfiles[0].email;
		}
	});

	// Handlers for age controls
	function incrementAge() {
		if (targetAge < maxAge()) {
			targetAge++;
		}
	}

	function decrementAge() {
		if (targetAge > 1) {
			targetAge--;
		}
	}

	function handleAgeInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value);
		if (!isNaN(value) && value >= 1 && value <= maxAge()) {
			targetAge = value;
		}
	}

	// Format age display based on toggle state
	function formatAge(age: number): string {
		if (age < 1) {
			if (age === 0) return 'Not born yet'; // 0 is always "not born yet"
			return showExactOffsets ? `–${Math.abs(age)} years old` : 'Not born yet';
		}
		return `${age} years old`;
	}
</script>

<ComponentErrorBoundary componentName="AgePlaygroundCard">
<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<Gamepad2 class="w-6 h-6 text-blue-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">Age Playground</h3>
	</div>

	{#if !hasEnoughData}
		<div class="text-center py-8">
			<Users class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
			<p class="text-gray-500 text-sm mb-3">
				Not enough family birthdays recorded to play with ages.
			</p>
			<a 
				href="/profile" 
				class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
			>
				<Clock class="w-4 h-4" aria-hidden="true" />
				Add Birthdays
				<ArrowRight class="w-4 h-4" aria-hidden="true" />
			</a>
		</div>
	{:else if familyProfiles.length === 0}
		<div class="text-center py-8">
			<Users class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
			<p class="text-gray-500 text-sm">
				No family member profiles found with birthdays.
			</p>
		</div>
	{:else}
		<div class="space-y-6">
			<!-- Family Member Selector -->
			<div>
				<label for="base-member" class="block text-sm font-medium text-gray-700 mb-2">
					Set age for:
				</label>
				<select
					id="base-member"
					bind:value={selectedBaseMember}
					class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
				>
					{#each familyProfiles as member (member.email)}
						<option value={member.email}>
							{displayNames[member.email]}
						</option>
					{/each}
				</select>
			</div>

			<!-- Age Input Controls -->
			<div>
				<label for="target-age-input" class="block text-sm font-medium text-gray-700 mb-2">
					Target age: <span class="font-semibold text-primary-600">{targetAge} years old</span>
				</label>
				
				<!-- Numeric Input -->
				<div class="mb-3">
					<input
						id="target-age-input"
						type="number"
						min="1"
						max="{maxAge()}"
						bind:value={targetAge}
						oninput={handleAgeInput}
						class="w-20 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 p-2"
						aria-label="Target age in years"
					/>
				</div>

				<!-- Slider with +/- buttons -->
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={decrementAge}
						disabled={targetAge <= 1}
						class="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary-500"
						aria-label="Decrease age by 1 year"
					>
						<Minus class="w-4 h-4" aria-hidden="true" />
					</button>
					
					<input
						id="target-age-slider"
						type="range"
						min="1"
						max="{maxAge()}"
						step="1"
						bind:value={targetAge}
						class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
						aria-label="Target age slider"
					/>
					
					<button
						type="button"
						onclick={incrementAge}
						disabled={targetAge >= maxAge()}
						class="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary-500"
						aria-label="Increase age by 1 year"
					>
						<Plus class="w-4 h-4" aria-hidden="true" />
					</button>
				</div>
				
				<div class="flex justify-between text-xs text-gray-500 mt-1">
					<span>1 year</span>
					<span>{maxAgeLabel()}</span>
				</div>
			</div>

			<!-- Toggle for negative ages -->
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={() => showExactOffsets = !showExactOffsets}
					class="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500"
					aria-pressed={showExactOffsets}
					aria-label="Toggle between showing 'Not born yet' and exact negative ages"
				>
					<div class="w-4 h-4 rounded border border-gray-400 flex items-center justify-center {showExactOffsets ? 'bg-primary-600 border-primary-600' : 'bg-white'}">
						{#if showExactOffsets}
							<div class="w-2 h-2 bg-white rounded-sm"></div>
						{/if}
					</div>
					Show exact offsets
				</button>
			</div>

			<!-- Family Ages Display -->
			{#if Object.keys(familyAges).length > 0}
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h4 class="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
						<Users class="w-4 h-4" aria-hidden="true" />
						Family Ages
					</h4>
					
					<div class="grid grid-cols-1 gap-2">
						{#each Object.entries(familyAges) as [email, age] (email)}
							<div class="flex justify-between items-center py-1">
								<span class="text-sm text-blue-800">
									{displayNames[email] || email.split('@')[0]}
								</span>
								<span class="text-sm font-semibold text-blue-900">
									{formatAge(age)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Fun Note -->
			<div class="bg-gray-50 rounded-lg p-3">
				<div class="flex items-center justify-center gap-2">
					<Gamepad2 class="w-4 h-4 text-purple-500" aria-hidden="true" />
					<p class="text-xs text-gray-600 text-center">
						Explore "what if" scenarios by adjusting ages!
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
</ComponentErrorBoundary>

<style>
	.slider::-webkit-slider-thumb {
		appearance: none;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #0ea5e9;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.slider::-moz-range-thumb {
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #0ea5e9;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
</style>