<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import { getUserRole, getRoleDisplayName, getSeededDisplayName, type AllowedEmail } from '$lib/utils/roles';
	import { profileStore, resolveAvatar } from '$lib/stores/profileStore';
	import { notificationStore } from '$lib/stores/notificationStore';

	let profile: Database['public']['Tables']['profiles']['Row'] | null = $state(null);
	let loading = $state(true);
	let saving = $state(false);
	let uploading = $state(false);

	// Form fields
	let displayName = $state('');
	let avatarPath = $state(''); // store only path
	let avatarSignedUrl = $state(''); // resolved signed url for preview
	let role = $state('member');
	let dob = $state('');

	let fileInput = $state() as HTMLInputElement;

	// Computed role values
	let computedRole = $derived(() => $user?.email ? getUserRole($user.email as AllowedEmail) : 'member');
	let roleDisplayName = $derived(() => $user?.email ? getRoleDisplayName($user.email) : 'Member');
	let isDobSet = $derived(() => Boolean(profile?.dob && profile.dob.trim() !== ''));

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
			profile = data as Database['public']['Tables']['profiles']['Row'];
			displayName = (data as any).display_name || getSeededDisplayName($user.email) || '';
			avatarPath = (data as any).avatar_url || '';
			role = computedRole();
			dob = (data as any).dob || '';
			// Resolve signed URL for preview
			if (avatarPath) avatarSignedUrl = await resolveAvatar(profile);
		} else {
			displayName = getSeededDisplayName($user.email) || '';
		}
	}

	async function saveProfile() {
		if (!$user?.email) return;

		try {
			saving = true;
			const profileData = {
				user_id: $user.id,
				email: $user.email,
				display_name: displayName || getSeededDisplayName($user.email) || null,
				avatar_url: avatarPath || null, // only path
				role: computedRole(),
				dob: dob || null,
				updated_at: new Date().toISOString()
			};

			if (profile) {
				const { error } = await supabase
					.from('profiles')
					.update(profileData as Database['public']['Tables']['profiles']['Update'])
					.eq('user_id', $user.id);
				if (error) throw error;
			} else {
				const { error } = await supabase
					.from('profiles')
					.insert({
						...profileData,
						created_at: new Date().toISOString()
					} as Database['public']['Tables']['profiles']['Insert']);
				if (error) throw error;
			}

			await loadProfile();
		} catch (error) {
			console.error('Error saving profile:', error);
		} finally {
			saving = false;
		}
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			notificationStore.add({ type: 'error', title: 'Invalid File', message: 'Please select an image file' });
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			notificationStore.add({ type: 'error', title: 'File Too Large', message: 'Image size must be less than 5MB' });
			return;
		}

		try {
			uploading = true;
			const { default: imageCompression } = await import('browser-image-compression');
			const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true });

			const path = `avatars/${$user?.id}-avatar.png`;
			const { error: uploadError } = await supabase.storage.from('post-media').upload(path, compressedFile, { upsert: true });
			if (uploadError) throw uploadError;

			// Update DB with path only
			await profileStore.updateProfile($user!.id, { avatar_url: path });
			avatarPath = path;
			avatarSignedUrl = await resolveAvatar({ ...profile, avatar_url: path } as any);

			await saveProfile();

			notificationStore.add({ type: 'success', title: 'Profile Updated', message: 'Profile picture updated successfully!' });
		} catch (error) {
			console.error('Error uploading image:', error);
			notificationStore.add({ type: 'error', title: 'Upload Failed', message: 'Upload failed. Please try again.' });
		} finally {
			uploading = false;
		}
	}

	async function signOut() {
		await supabase.auth.signOut();
		goto('/');
	}
</script>

<svelte:head>
	<title>Profile - Family</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<h1 class="text-xl font-semibold text-gray-900">Profile</h1>
				<div class="flex items-center gap-4">
					{#if getUserRole($user?.email) === 'parent'}
						<button type="button" onclick={() => goto('/settings')} class="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1" aria-label="Settings">⚙️ Settings</button>
					{/if}
					<button type="button" onclick={signOut} class="text-red-600 hover:text-red-700 font-medium">Sign Out</button>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if loading}
			<Loading text="Loading profile..." />
		{:else}
			<div class="card">
				<h2 class="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>

				<form onsubmit={async (e) => { e.preventDefault(); await saveProfile(); }} class="space-y-6">
					<!-- Email -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
						<input type="email" value={$user?.email || ''} disabled class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" />
						<p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
					</div>

					<!-- Display Name -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
						<input type="text" bind:value={displayName} placeholder="Enter your display name" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
					</div>

					<!-- Avatar -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
						{#if avatarSignedUrl}
							<div class="mb-4">
								<img src={avatarSignedUrl} alt="profile picture" class="w-20 h-20 rounded-full object-cover border-2 border-gray-200" onerror={() => avatarSignedUrl = ''} />
							</div>
						{/if}
						<div class="space-y-3">
							<input type="file" bind:this={fileInput} onchange={handleFileSelect} accept="image/*" class="hidden" id="avatar-upload" />
							<button type="button" onclick={() => fileInput.click()} disabled={uploading} class="btn btn-secondary flex items-center gap-2">
								{#if uploading}
									<div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
									Uploading...
								{:else} 📷 Upload Photo {/if}
							</button>
						</div>
						<p class="text-xs text-gray-500 mt-2">Supported formats: JPG, PNG, GIF. Max size: 5MB.</p>
					</div>

					<!-- Role -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
						<div class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">{roleDisplayName()}</div>
						<p class="text-xs text-gray-500 mt-1">Role is determined by your email and cannot be changed</p>
					</div>

					<!-- DOB -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
						<input type="date" bind:value={dob} disabled={isDobSet()} class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" class:bg-gray-50={isDobSet()} class:text-gray-500={isDobSet()} />
						{#if isDobSet()}
							<p class="text-xs text-gray-500 mt-1">Date of birth is locked to prevent accidental changes</p>
						{/if}
					</div>

					<!-- Save -->
					<div class="pt-4">
						<button type="submit" disabled={saving} class="w-full btn btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save Profile'}</button>
					</div>
				</form>
			</div>
		{/if}
	</main>
</div>
