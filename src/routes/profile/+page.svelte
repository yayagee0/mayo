<script lang="ts">
  import { onMount } from 'svelte';
  import { auth, createOrUpdateUser, getUser, uploadFile } from '$lib/firebase';
  import { FAMILY_ID } from '$lib/allowlist';
  // ✅ browser-image-compression dynamically imported to avoid SSR issues  
  import { Camera, User } from 'lucide-svelte';

  let user = $state(null);
  let userData = $state(null);
  let displayName = $state('');
  let avatarUrl = $state('');
  let selectedFile = $state(null);
  let loading = $state(true);
  let saving = $state(false);
  let uploading = $state(false);

  onMount(async () => {
    user = auth.currentUser;
    
    if (user) {
      try {
        // Load existing user data
        userData = await getUser(user.uid);
        
        if (userData) {
          displayName = userData.displayName || '';
          avatarUrl = userData.avatarUrl || '';
        } else {
          // Initialize with default values
          displayName = user.displayName || '';
          avatarUrl = user.photoURL || '';
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
    
    loading = false;
  });

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      selectedFile = input.files[0];
      
      // Upload immediately
      await handleAvatarUpload();
    }
  }

  async function compressImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 400,
      useWebWorker: true,
      fileType: 'image/jpeg' as const,
      quality: 0.8
    };

    try {
      // ✅ Dynamic import to avoid SSR issues
      const { default: imageCompression } = await import('browser-image-compression');
      return await imageCompression(file, options);
    } catch (error) {
      console.warn('Image compression failed, using original file:', error);
      return file;
    }
  }

  async function handleAvatarUpload() {
    if (!selectedFile || !user || uploading) return;

    try {
      uploading = true;

      // Compress the image
      const compressedFile = await compressImage(selectedFile);
      
      // Upload to Firebase Storage
      const path = `avatars/${user.uid}.jpg`;
      const downloadUrl = await uploadFile(compressedFile, path);
      
      // Update avatar URL
      avatarUrl = downloadUrl;
      
      // Auto-save profile with new avatar
      await handleSaveProfile();
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      uploading = false;
      selectedFile = null;
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }

  async function handleSaveProfile(event: Event) {
    event.preventDefault();
    if (!user || saving) return;

    try {
      saving = true;

      const profileData = {
        email: user.email!,
        displayName: displayName.trim() || user.displayName || user.email!.split('@')[0],
        avatarUrl: avatarUrl || undefined,
        familyId: FAMILY_ID
      };

      await createOrUpdateUser(user.uid, profileData);
      
      // Update local userData
      userData = profileData;
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      saving = false;
    }
  }

  function getAvatarDisplay() {
    if (avatarUrl) return avatarUrl;
    if (user?.photoURL) return user.photoURL;
    
    const name = displayName || user?.displayName || user?.email || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff&size=200`;
  }
</script>

<svelte:head>
  <title>Profile - Mayo Family Platform</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <!-- Header -->
  <div class="text-center">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
    <p class="text-gray-600">Manage your family profile information</p>
  </div>

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else}
    <!-- Avatar Section -->
    <div class="card text-center">
      <div class="relative inline-block">
        <img
          src={getAvatarDisplay()}
          alt="Profile avatar"
          class="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
        />
        
        <label class="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
          <Camera class="h-5 w-5" />
          <input
            type="file"
            accept="image/*"
            class="hidden"
            onchange={handleFileSelect}
            disabled={uploading}
          />
        </label>
        
        {#if uploading}
          <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        {/if}
      </div>
      
      <p class="text-sm text-gray-500 mt-4">
        Click the camera icon to upload a new profile picture
      </p>
    </div>

    <!-- Profile Form -->
    <form onsubmit={handleSaveProfile} class="card space-y-6">
      <h2 class="text-lg font-semibold text-gray-900">Profile Information</h2>
      
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={user?.email || ''}
          disabled
          class="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
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
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label for="familyId" class="block text-sm font-medium text-gray-700 mb-2">
          Family ID
        </label>
        <input
          id="familyId"
          type="text"
          value={FAMILY_ID}
          disabled
          class="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
        />
        <p class="text-xs text-gray-500 mt-1">You are part of the {FAMILY_ID} family</p>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button
          type="submit"
          class="btn btn-primary"
          disabled={saving || !displayName.trim()}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>

    <!-- Account Information -->
    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
      
      <div class="space-y-3 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Account created:</span>
          <span class="text-gray-900">
            {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
          </span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-600">Last sign in:</span>
          <span class="text-gray-900">
            {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}
          </span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-600">Email verified:</span>
          <span class="text-gray-900">
            {user?.emailVerified ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  {/if}
</div>
