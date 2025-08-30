<script lang="ts">
  import { createPost, uploadFile } from './firebase';
  import { FAMILY_ID } from './allowlist';
  import imageCompression from 'browser-image-compression';
  import { Upload, Youtube, Type, Image, Video } from 'lucide-svelte';

  let { user = $bindable() } = $props();
  
  let postText = '';
  let youtubeUrl = '';
  let selectedFile: File | null = null;
  let uploading = false;
  let postType: 'text' | 'youtube' | 'photo' | 'video' = 'text';

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      selectedFile = input.files[0];
      
      // Auto-detect post type based on file
      if (selectedFile.type.startsWith('image/')) {
        postType = 'photo';
      } else if (selectedFile.type.startsWith('video/')) {
        postType = 'video';
      }
    }
  }

  async function compressImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg' as const,
      quality: 0.8
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.warn('Image compression failed, using original file:', error);
      return file;
    }
  }

  async function handleSubmit() {
    if (!user || uploading) return;

    if (postType === 'text' && !postText.trim()) return;
    if (postType === 'youtube' && !youtubeUrl.trim()) return;
    if ((postType === 'photo' || postType === 'video') && !selectedFile) return;

    try {
      uploading = true;

      let filePath = '';
      let youtubeId = '';

      // Handle file upload
      if (selectedFile && (postType === 'photo' || postType === 'video')) {
        let fileToUpload = selectedFile;
        
        // Compress images only
        if (postType === 'photo' && selectedFile.type.startsWith('image/')) {
          fileToUpload = await compressImage(selectedFile);
        }

        const timestamp = Date.now();
        const extension = fileToUpload.name.split('.').pop();
        const fileName = `${user.uid}_${timestamp}.${extension}`;
        const path = `${postType}s/${fileName}`;
        
        await uploadFile(fileToUpload, path);
        filePath = path;
      }

      // Extract YouTube ID
      if (postType === 'youtube' && youtubeUrl) {
        const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
        const match = youtubeUrl.match(regex);
        youtubeId = match ? match[1] : '';
      }

      // Create post
      const postData = {
        familyId: FAMILY_ID,
        authorUid: user.uid,
        createdAt: new Date().toISOString(),
        kind: postType,
        ...(postType === 'text' && { text: postText.trim() }),
        ...(postType === 'youtube' && { youtubeId, text: postText.trim() }),
        ...(postType === 'photo' && { imagePath: filePath, text: postText.trim() }),
        ...(postType === 'video' && { videoPath: filePath, text: postText.trim() })
      };

      await createPost(postData);

      // Reset form
      postText = '';
      youtubeUrl = '';
      selectedFile = null;
      postType = 'text';
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      uploading = false;
    }
  }

  function resetForm() {
    postText = '';
    youtubeUrl = '';
    selectedFile = null;
    postType = 'text';
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
</script>

<div class="card max-w-2xl mx-auto">
  <h2 class="text-lg font-semibold text-gray-900 mb-4">Share Something</h2>
  
  <!-- Post Type Selector -->
  <div class="flex space-x-2 mb-4">
    <button
      type="button"
      class="flex items-center px-3 py-2 text-sm rounded-md transition-colors
             {postType === 'text' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
      on:click={() => postType = 'text'}
    >
      <Type class="h-4 w-4 mr-2" />
      Text
    </button>
    <button
      type="button"
      class="flex items-center px-3 py-2 text-sm rounded-md transition-colors
             {postType === 'youtube' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
      on:click={() => postType = 'youtube'}
    >
      <Youtube class="h-4 w-4 mr-2" />
      YouTube
    </button>
    <button
      type="button"
      class="flex items-center px-3 py-2 text-sm rounded-md transition-colors
             {postType === 'photo' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
      on:click={() => postType = 'photo'}
    >
      <Image class="h-4 w-4 mr-2" />
      Photo
    </button>
    <button
      type="button"
      class="flex items-center px-3 py-2 text-sm rounded-md transition-colors
             {postType === 'video' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
      on:click={() => postType = 'video'}
    >
      <Video class="h-4 w-4 mr-2" />
      Video
    </button>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <!-- Text Input (always shown) -->
    <div>
      <textarea
        bind:value={postText}
        placeholder={postType === 'text' ? 'What\'s on your mind?' : 'Add a caption...'}
        class="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        rows="3"
        required={postType === 'text'}
      ></textarea>
    </div>

    <!-- YouTube URL Input -->
    {#if postType === 'youtube'}
      <div>
        <input
          type="url"
          bind:value={youtubeUrl}
          placeholder="https://youtube.com/watch?v=..."
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>
    {/if}

    <!-- File Input -->
    {#if postType === 'photo' || postType === 'video'}
      <div>
        <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload class="h-8 w-8 text-gray-400 mb-2" />
            <p class="text-sm text-gray-500">
              {selectedFile ? selectedFile.name : `Click to upload ${postType}`}
            </p>
            <p class="text-xs text-gray-400">
              {postType === 'photo' ? 'Images will be compressed to ≤2MB, max 1920px' : 'Upload raw video files'}
            </p>
          </div>
          <input
            type="file"
            class="hidden"
            accept={postType === 'photo' ? 'image/*' : 'video/*'}
            on:change={handleFileSelect}
            required
          />
        </label>
      </div>
    {/if}

    <!-- Action Buttons -->
    <div class="flex justify-end space-x-3">
      <button
        type="button"
        on:click={resetForm}
        class="btn btn-secondary"
        disabled={uploading}
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        disabled={uploading || (postType === 'text' && !postText.trim()) || 
                  (postType === 'youtube' && !youtubeUrl.trim()) || 
                  ((postType === 'photo' || postType === 'video') && !selectedFile)}
      >
        {uploading ? 'Posting...' : 'Post'}
      </button>
    </div>
  </form>
</div>