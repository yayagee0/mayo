<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import dayjs from 'dayjs';

	interface Props extends WidgetProps {}

	let { session, profiles, items, interactions }: Props = $props();

	let upcomingBirthdays = $derived(profiles
		.filter(profile => profile.dob)
		.map(profile => {
			const birthday = dayjs(profile.dob);
			const thisYear = dayjs().year();
			const birthdayThisYear = birthday.year(thisYear);
			const birthdayNextYear = birthday.year(thisYear + 1);
			
			const daysUntilBirthday = birthdayThisYear.isAfter(dayjs()) 
				? birthdayThisYear.diff(dayjs(), 'day')
				: birthdayNextYear.diff(dayjs(), 'day');

			return {
				...profile,
				birthday: birthdayThisYear.isAfter(dayjs()) ? birthdayThisYear : birthdayNextYear,
				daysUntil: daysUntilBirthday,
				age: birthdayThisYear.isAfter(dayjs()) ? thisYear - birthday.year() : thisYear - birthday.year() + 1,
				isToday: daysUntilBirthday === 0
			};
		})
		.sort((a, b) => a.daysUntil - b.daysUntil)
		.slice(0, 3));
</script>

<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<span class="text-2xl">🎂</span>
		<h3 class="text-lg font-semibold text-gray-900">Upcoming Birthdays</h3>
	</div>

	{#if upcomingBirthdays.length === 0}
		<p class="text-gray-500 text-sm">No upcoming birthdays in the next year.</p>
	{:else}
		<div class="space-y-3">
			{#each upcomingBirthdays as person (person.user_id)}
				<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
					<div class="flex items-center gap-3">
						{#if person.avatar_url}
							<img 
								src={person.avatar_url} 
								alt={person.display_name || person.email}
								class="w-10 h-10 rounded-full object-cover"
							/>
						{:else}
							<div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
								<span class="text-primary-600 font-semibold">
									{(person.display_name || person.email).charAt(0).toUpperCase()}
								</span>
							</div>
						{/if}
						
						<div>
							<p class="font-medium text-gray-900">
								{person.display_name || person.email.split('@')[0]}
							</p>
							<p class="text-sm text-gray-600">
								{#if person.isToday}
									🎉 Today! Turning {person.age}
								{:else if person.daysUntil === 1}
									Tomorrow, turning {person.age}
								{:else if person.daysUntil <= 7}
									In {person.daysUntil} days, turning {person.age}
								{:else}
									{person.birthday.format('MMM D')}, turning {person.age}
								{/if}
							</p>
						</div>
					</div>
					
					{#if person.isToday}
						<span class="text-2xl animate-bounce">🎉</span>
					{:else if person.daysUntil <= 7}
						<span class="text-lg">🎈</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>