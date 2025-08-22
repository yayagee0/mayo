<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import dayjs from 'dayjs';

	interface Props extends WidgetProps {}

	let { session, profiles, items, interactions }: Props = $props();

	let todayAyah = $derived(items
		.filter(item => item.kind === 'ayah')
		.find(item => dayjs(item.created_at).isSame(dayjs(), 'day')));

	// Sample ayahs for demonstration if none in database
	const sampleAyahs = [
		{
			arabic: "وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ",
			translation: "And Allah loves the doers of good.",
			reference: "Quran 3:134"
		},
		{
			arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
			translation: "And whoever fears Allah - He will make for him a way out.",
			reference: "Quran 65:2"
		},
		{
			arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
			translation: "Indeed, with hardship comes ease.",
			reference: "Quran 94:6"
		}
	];

	let displayAyah = $derived(todayAyah?.data || sampleAyahs[dayjs().day() % sampleAyahs.length]);
</script>

<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<span class="text-2xl">📖</span>
		<h3 class="text-lg font-semibold text-gray-900">Daily Ayah</h3>
	</div>

	{#if displayAyah}
		<div class="space-y-4">
			<div class="text-right">
				<p class="text-xl text-gray-800 leading-relaxed" dir="rtl" style="font-family: 'Amiri', 'Scheherazade', serif;">
					{displayAyah.arabic}
				</p>
			</div>
			
			<div class="border-t pt-4">
				<p class="text-gray-700 italic mb-2">
					"{displayAyah.translation}"
				</p>
				<p class="text-sm text-gray-500 font-medium">
					— {displayAyah.reference}
				</p>
			</div>

			<div class="flex items-center justify-between pt-2">
				<span class="text-xs text-gray-400">
					{dayjs().format('dddd, MMMM D, YYYY')}
				</span>
				<button 
					class="text-primary-600 hover:text-primary-700 text-sm font-medium"
					onclick={() => {
						if (navigator.share) {
							navigator.share({
								title: 'Daily Ayah',
								text: `${displayAyah.translation} — ${displayAyah.reference}`
							});
						}
					}}
				>
					Share
				</button>
			</div>
		</div>
	{:else}
		<p class="text-gray-500 text-sm">No ayah available for today.</p>
	{/if}
</div>

