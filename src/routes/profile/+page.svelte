<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';

	let profile: Database['public']['Tables']['profiles']['Row'] | null = null;
	let loading = true;
	let saving = false;

	// Form fields
	let displayName = '';
	let avatarUrl = '';
	let role = 'member';
	let dob = '';

	onMount(async () => {
		if (!$session) {
			goto('/');
			return;
		}

		await loadProfile();
		loading = false;
	});

	async function loadProfile() {
		if (!$user?.email) return;

		const { data } = await supabase
			.from('profiles')
			.select('*')
			.eq('email', $user.email)
			.single();

		if (data) {
			profile = data;
			displayName = data.display_name || '';
			avatarUrl = data.avatar_url || '';
			role = data.role || 'member';
			dob = data.dob || '';
		}
	}

	async function saveProfile() {
		if (!$user?.email) return;

		try {
			saving = true;
			const profileData = {
				user_id: $user.id,
				email: $user.email,
				display_name: displayName || null,
				avatar_url: avatarUrl || null,
				role,
				dob: dob || null,
				updated_at: new Date().toISOString()
			};

			if (profile) {
				const { error } = await supabase
					.from('profiles')
					.update(profileData)
					.eq('user_id', $user.id);
				
				if (error) throw error;
			} else {
				const { error } = await supabase
					.from('profiles')
					.insert({
						...profileData,
						created_at: new Date().toISOString()
					});
				
				if (error) throw error;
			}

			await loadProfile();
		} catch (error) {
			console.error('Error saving profile:', error);
		} finally {
			saving = false;
		}
	}

	async function signOut() {
		await supabase.auth.signOut();
		goto('/');
	}
</script>

<svelte:head>
	<title>Profile - Mayo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<h1 class="text-xl font-semibold text-gray-900">Profile</h1>
				<button
					type="button"
					on:click={signOut}
					class="text-red-600 hover:text-red-700 font-medium"
				>
					Sign Out
				</button>
			</div>
		</div>
	</header>

	<main class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if loading}
			<div class="flex justify-center items-center h-64">
				<div class="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
			</div>
		{:else}
			<div class="card">
				<h2 class="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>

				<form on:submit|preventDefault={saveProfile} class="space-y-6">
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
							Email Address
						</label>
						<input
							type="email"
							id="email"
							value={$user?.email || ''}
							disabled
							class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
						/>
						<p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
					</div>

					<div>
						<label for="displayName" class="block text-sm font-medium text-gray-700 mb-2">
							Display Name
						</label>
						<input
							type="text"
							id="displayName"
							bind:value={displayName}
							placeholder="Enter your display name"
							class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
					</div>

					<div>
						<label for="avatarUrl" class="block text-sm font-medium text-gray-700 mb-2">
							Avatar URL
						</label>
						<input
							type="url"
							id="avatarUrl"
							bind:value={avatarUrl}
							placeholder="https://example.com/avatar.jpg"
							class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
						{#if avatarUrl}
							<div class="mt-2">
								<img 
									src={avatarUrl} 
									alt="Avatar preview"
									class="w-16 h-16 rounded-full object-cover"
									on:error={() => avatarUrl = ''}
								/>
							</div>
						{/if}
					</div>

					<div>
						<label for="role" class="block text-sm font-medium text-gray-700 mb-2">
							Role
						</label>
						<select
							id="role"
							bind:value={role}
							class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						>
							<option value="member">Member</option>
							<option value="parent">Parent</option>
							<option value="child">Child</option>
						</select>
					</div>

					<div>
						<label for="dob" class="block text-sm font-medium text-gray-700 mb-2">
							Date of Birth
						</label>
						<input
							type="date"
							id="dob"
							bind:value={dob}
							class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
					</div>

					<div class="pt-4">
						<button
							type="submit"
							disabled={saving}
							class="w-full btn btn-primary disabled:opacity-50"
						>
							{saving ? 'Saving...' : 'Save Profile'}
						</button>
					</div>
				</form>
			</div>
		{/if}
	</main>
</div>