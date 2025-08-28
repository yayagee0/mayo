<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { Star, Shuffle, Users, ArrowRight, Clock } from 'lucide-svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import { profileStore } from '$lib/stores/profileStore';
	import { 
		calculateFamilyAgesWithNegatives, 
		getFamilyMemberDisplayNames, 
		hasRequiredDobs, 
		getAllFamilyProfiles 
	} from '$lib/utils/age';
	import { 
		dreamRoles, 
		getRandomDreamRole, 
		renderWorldImpactScore,
		type DreamRole 
	} from '$lib/data/dreamRoles';

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

	// State for the Dream Builder
	let selectedDream = $state<DreamRole | null>(null);
	let selectedSpotlightMember = $state('');
	let familyAges = $state<{ [email: string]: number }>({});
	let showExactOffsets = $state(false); // Toggle for showing negative ages vs "Not born yet"
	let showMeaningPanel = $state(false);

	// Calculate max age based on user
	let maxAge = $derived(() => {
		// Ghassan can reach age 70, others limited to 18
		if (session?.user?.email === 'nilezat@gmail.com') {
			return 70;
		}
		return 18;
	});

	// Auto-select first family member if none selected
	$effect(() => {
		if (familyProfiles.length > 0 && !selectedSpotlightMember) {
			selectedSpotlightMember = familyProfiles[0].email;
		}
	});

	// Calculate family ages when dream or spotlight member changes
	$effect(() => {
		if (selectedDream && selectedSpotlightMember && profiles.length > 0) {
			familyAges = calculateFamilyAgesWithNegatives(
				profiles, 
				selectedSpotlightMember, 
				selectedDream.typicalAge
			);
			showMeaningPanel = true;
		} else {
			familyAges = {};
			showMeaningPanel = false;
		}
	});

	// Handlers
	function selectDream(dream: DreamRole) {
		selectedDream = dream;
	}

	function selectRandomDream() {
		selectedDream = getRandomDreamRole();
	}

	function changeSpotlight(email: string) {
		selectedSpotlightMember = email;
	}

	// Format age display based on toggle state
	function formatAge(age: number): string {
		if (age < 1) {
			if (age === 0) return 'Not born yet'; // 0 is always "not born yet"
			return showExactOffsets ? `${age} years old` : 'Not born yet';
		}
		return `${age} years old`;
	}

	// Generate narrative for family member based on dream role
	function generateNarrative(email: string, dream: DreamRole): string {
		const displayName = displayNames[email] || email.split('@')[0];
		const age = familyAges[email];
		
		if (email === selectedSpotlightMember) {
			return `${displayName} becomes a ${dream.role}! ${dream.meaning.description}`;
		}

		// Generate supportive/humorous roles for other family members
		const supportiveRoles: { [key: string]: string[] } = {
			"Engineer": [
				"designs the blueprint for {name}'s success",
				"builds the foundation for {name}'s dreams",
				"troubleshoots problems in {name}'s path"
			],
			"Pilot": [
				"navigates the route to {name}'s success",
				"helps {name} soar to new heights",
				"ensures {name}'s journey is smooth"
			],
			"Doctor": [
				"keeps {name} healthy and strong",
				"provides the care {name} needs to heal others",
				"supports {name}'s compassionate mission"
			],
			"Teacher": [
				"learns from {name}'s wisdom",
				"helps {name} prepare lessons",
				"becomes {name}'s most dedicated student"
			],
			"Singer": [
				"becomes {name}'s biggest fan",
				"helps {name} practice harmonies",
				"cheers loudest at {name}'s concerts"
			],
			"Actor": [
				"becomes {name}'s acting coach",
				"helps {name} rehearse lines",
				"claps loudest at {name}'s performances"
			],
			"Astronaut": [
				"tracks {name}'s missions from ground control",
				"helps {name} reach for the stars",
				"becomes {name}'s mission support team"
			],
			"Youtuber": [
				"becomes {name}'s video editor",
				"helps {name} brainstorm content ideas",
				"shares {name}'s videos with everyone"
			],
			"Environmental Scientist": [
				"helps {name} plant trees and clean oceans",
				"joins {name} in protecting wildlife",
				"becomes {name}'s eco-warrior partner"
			],
			"Game Designer": [
				"becomes {name}'s beta tester",
				"helps {name} brainstorm game ideas",
				"plays {name}'s games all day long"
			],
			"Entrepreneur": [
				"becomes {name}'s business partner",
				"helps {name} develop brilliant ideas",
				"invests in {name}'s dreams"
			],
			"Lawyer": [
				"becomes {name}'s legal assistant",
				"helps {name} fight for justice",
				"supports {name} in court cases"
			]
		};

		const roles = supportiveRoles[dream.role] || [
			"supports {name} in achieving their dreams",
			"becomes {name}'s biggest supporter",
			"helps {name} succeed in their career"
		];
		
		const randomRole = roles[Math.floor(Math.random() * roles.length)];
		const spotlightName = displayNames[selectedSpotlightMember] || selectedSpotlightMember.split('@')[0];
		
		return `${displayName} ${randomRole.replace('{name}', spotlightName)}`;
	}
</script>

<ComponentErrorBoundary componentName="DreamBuilderPlaygroundCard">
<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<Star class="w-5 h-5 text-purple-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">Dream Builder Playground</h3>
	</div>

	{#if !hasEnoughData}
		<div class="text-center py-8">
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
			<!-- Dream Selection Section -->
			<div>
				<div class="flex items-center justify-between mb-3">
					<h4 class="text-sm font-medium text-gray-700">Choose a Dream</h4>
					<button
						onclick={selectRandomDream}
						class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
						aria-label="Select a random dream role"
					>
						<Shuffle class="w-3 h-3" aria-hidden="true" />
						Random Dream
					</button>
				</div>
				
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
					{#each dreamRoles as dream (dream.role)}
						<button
							onclick={() => selectDream(dream)}
							class="p-3 border-2 rounded-lg transition-all hover:shadow-md focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 {selectedDream?.role === dream.role ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}"
							aria-label="Select dream role: {dream.role}"
						>
							<div class="text-2xl mb-1">{dream.icon}</div>
							<div class="text-xs font-medium text-gray-900">{dream.role}</div>
							<div class="text-xs text-gray-500">Age {dream.typicalAge}</div>
						</button>
					{/each}
				</div>
			</div>

			{#if selectedDream}
				<!-- Role Reversal Section -->
				<div>
					<h4 class="text-sm font-medium text-gray-700 mb-2">Who gets this dream?</h4>
					<div class="flex flex-wrap gap-2">
						{#each familyProfiles as profile (profile.email)}
							<button
								onclick={() => changeSpotlight(profile.email)}
								class="px-3 py-1 text-sm rounded-full transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 {selectedSpotlightMember === profile.email ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
								aria-label="Set {displayNames[profile.email]} as the dreamer"
							>
								{displayNames[profile.email] || profile.email.split('@')[0]}
							</button>
						{/each}
					</div>
				</div>

				<!-- Age Display Toggle -->
				<div class="flex items-center gap-2">
					<button
						onclick={() => showExactOffsets = !showExactOffsets}
						class="flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
						aria-pressed={showExactOffsets}
						aria-label="Toggle between showing exact ages and 'Not born yet'"
					>
						<div class="w-3 h-3 rounded-full border-2 border-gray-400 {showExactOffsets ? 'bg-gray-400' : ''}"></div>
						Show exact offsets
					</button>
				</div>

				<!-- Narrative Output -->
				<div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
					<h4 class="text-sm font-medium text-purple-900 mb-3 flex items-center gap-2">
						<Star class="w-4 h-4" aria-hidden="true" />
						Dream Scenario
					</h4>
					
					<div class="space-y-2">
						{#each Object.entries(familyAges) as [email, age] (email)}
							<div class="flex justify-between items-start gap-3 py-1">
								<div class="flex-1">
									<span class="text-sm font-medium text-purple-800">
										{displayNames[email] || email.split('@')[0]}
									</span>
									<span class="text-xs text-purple-600 ml-2">
										({formatAge(age)})
									</span>
									<p class="text-xs text-purple-700 mt-1">
										{generateNarrative(email, selectedDream)}
									</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Meaning Panel -->
				{#if showMeaningPanel}
					<div class="bg-blue-50 rounded-lg p-4">
						<h4 class="text-sm font-medium text-blue-900 mb-3">
							About Being a {selectedDream.role}
						</h4>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
							<div>
								<h5 class="font-medium text-blue-800 mb-1">Age</h5>
								<p class="text-blue-700">Typically achieved at {selectedDream.meaning.age} years old</p>
							</div>
							
							<div>
								<h5 class="font-medium text-blue-800 mb-1">Description</h5>
								<p class="text-blue-700">{selectedDream.meaning.description}</p>
							</div>
							
							<div>
								<h5 class="font-medium text-blue-800 mb-1">Impact</h5>
								<p class="text-blue-700">{selectedDream.meaning.impact}</p>
							</div>
							
							<div>
								<h5 class="font-medium text-blue-800 mb-1">Values</h5>
								<p class="text-blue-700">{selectedDream.meaning.values.join(', ')}</p>
							</div>
							
							<div>
								<h5 class="font-medium text-blue-800 mb-1">Journey</h5>
								<p class="text-blue-700">{selectedDream.meaning.journey}</p>
							</div>
							
							<div>
								<h5 class="font-medium text-blue-800 mb-1">Joy</h5>
								<p class="text-blue-700">{selectedDream.meaning.joy}</p>
							</div>
							
							<div>
								<h5 class="font-medium text-blue-800 mb-1">Challenges</h5>
								<p class="text-blue-700">{selectedDream.meaning.challenges}</p>
							</div>
							
							<div>
								<h5 class="font-medium text-blue-800 mb-1">Legacy</h5>
								<p class="text-blue-700">{selectedDream.meaning.legacy}</p>
							</div>
							
							<div>
								<h5 class="font-medium text-blue-800 mb-1">Role Models</h5>
								<p class="text-blue-700">{selectedDream.meaning.roleModels.join(', ')}</p>
							</div>
							
							<div>
								<h5 class="font-medium text-blue-800 mb-1">World Impact Score</h5>
								<p class="text-blue-700">
									{renderWorldImpactScore(selectedDream.meaning.worldImpactScore)} 
									({selectedDream.meaning.worldImpactScore}/5)
								</p>
							</div>
							
							<div class="md:col-span-2">
								<h5 class="font-medium text-blue-800 mb-1">Personal Fit</h5>
								<p class="text-blue-700">{selectedDream.meaning.personalFit}</p>
							</div>
						</div>
					</div>
				{/if}
			{/if}

			<!-- Fun Note -->
			<div class="bg-gray-50 rounded-lg p-3">
				<div class="flex items-center justify-center gap-2">
					<Star class="w-4 h-4 text-purple-500" aria-hidden="true" />
					<p class="text-xs text-gray-600 text-center">
						Explore dreams and see your family in amazing future roles!
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
</ComponentErrorBoundary>