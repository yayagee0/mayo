<script lang="ts">
	import { Camera, BarChart3, Link2, Send, X, Plus, Minus } from 'lucide-svelte';
	import { compressMediaFile, type CompressionProgress, validateMediaFile, getValidatedMimeType } from '$lib/utils/mediaCompression';
	import { parseYouTubeUrl, isValidYouTubeUrl } from '$lib/utils/youtubeParser';
	import { supabase } from '$lib/supabase';
	import { session } from '$lib/stores/sessionStore';
	import type { Database } from '$lib/supabase';
	// ✅ heic2any dynamically imported to avoid SSR issues
	
	interface PostComposerProps {
		onPostCreated?: () => void;
		onCancel?: () => void;
		placeholder?: string;
		embedded?: boolean;
	}
	
	let { onPostCreated, onCancel, placeholder = "What's on your mind? Share something meaningful...", embedded = false }: PostComposerProps = $props();
	
	type ComposerMode = 'text' | 'media' | 'poll' | 'youtube';
	
	let mode: ComposerMode = $state('text');
	let content = $state('');
	let isSubmitting = $state(false);
	let error = $state('');
	
	// Media upload state
	let selectedFiles: File[] = $state([]);
	let uploadProgress: CompressionProgress | null = $state(null);
	let mediaUrls: string[] = $state([]);
	
	// Poll state
	let pollQuestion = $state('');
	let pollOptions = $state(['', '']);
	
	// YouTube state
	let youtubeUrl = $state('');
	let youtubeInfo = $state<ReturnType<typeof parseYouTubeUrl>>(null);
	
	function resetForm() {
		mode = 'text';
		content = '';
		error = '';
		selectedFiles = [];
		uploadProgress = null;
		mediaUrls = [];
		pollQuestion = '';
		pollOptions = ['', ''];
		youtubeUrl = '';
		youtubeInfo = null;
	}
	
	function handleModeChange(newMode: ComposerMode) {
		mode = newMode;
		error = '';
	}
	
	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files) return;
		const files = Array.from(input.files);
		const validFiles: File[] = [];

		for (const file of files) {
			let processedFile: File = file;

			// ✅ Enhanced HEIC conversion with retry logic
			if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
				let conversionSuccess = false;
				let lastError: any = null;
				
				// Try conversion up to 2 times
				for (let attempt = 1; attempt <= 2; attempt++) {
					try {
						const { default: heic2any } = await import('heic2any');
						const blob = await heic2any({ 
							blob: file, 
							toType: "image/jpeg",
							quality: 0.8 // Slightly lower quality for reliability
						});
						processedFile = new File([blob as BlobPart], file.name.replace(/\.heic$/i, ".jpg"), {
							type: "image/jpeg"
						});
						conversionSuccess = true;
						break;
					} catch (err) {
						lastError = err;
						console.warn(`HEIC conversion attempt ${attempt} failed:`, err);
						if (attempt < 2) {
							// Wait briefly before retry
							await new Promise(resolve => setTimeout(resolve, 500));
						}
					}
				}
				
				if (!conversionSuccess) {
					console.error("HEIC conversion failed after retries:", lastError);
					error = "Failed to convert HEIC image. Please select a JPEG or PNG image instead.";
					return;
				}
			}

			const validation = validateMediaFile(processedFile);
			if (validation.valid) {
				validFiles.push(processedFile);
			} else {
				error = validation.error || "Invalid file";
				return;
			}
		}

		selectedFiles = validFiles;
		error = "";
	}
	
	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}
	
	function addPollOption() {
		if (pollOptions.length < 6) {
			pollOptions = [...pollOptions, ''];
		}
	}
	
	function removePollOption(index: number) {
		if (pollOptions.length > 2) {
			pollOptions = pollOptions.filter((_, i) => i !== index);
		}
	}
	
	function handleYouTubeUrlChange() {
		if (!youtubeUrl.trim()) {
			youtubeInfo = null;
			return;
		}
		if (isValidYouTubeUrl(youtubeUrl)) {
			youtubeInfo = parseYouTubeUrl(youtubeUrl);
			error = '';
		} else {
			youtubeInfo = null;
			error = 'Please enter a valid YouTube URL';
		}
	}
	
	async function uploadMediaFiles(): Promise<string[]> {
		// Validate session before starting upload
		const currentSession = $session;
		if (!currentSession) {
			throw new Error('Please log in to upload files');
		}
		
		// Check if session token is close to expiry (within 5 minutes)
		const expiresAt = currentSession.expires_at;
		if (expiresAt && (expiresAt * 1000 - Date.now()) < 5 * 60 * 1000) {
			console.log('Session token is near expiry, refreshing...');
			try {
				const { data, error } = await supabase.auth.refreshSession();
				if (error) {
					console.warn('Failed to refresh session:', error);
					throw new Error('Session expired. Please log in again.');
				}
			} catch (refreshError) {
				console.error('Session refresh failed:', refreshError);
				throw new Error('Session expired. Please log in again.');
			}
		}
		
		const urls: string[] = [];
		for (let i = 0; i < selectedFiles.length; i++) {
			const file = selectedFiles[i];
			try {
				uploadProgress = { phase: 'compressing', progress: 0, message: `Compressing file ${i + 1}/${selectedFiles.length}...` };
				const compressedFile = await compressMediaFile(file, (progress) => {
					uploadProgress = { ...progress, message: `${progress.message} (${i + 1}/${selectedFiles.length})` };
				});
				uploadProgress = { phase: 'uploading', progress: 80, message: `Uploading file ${i + 1}/${selectedFiles.length}...` };
				const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${compressedFile.name}`;
				const contentType = getValidatedMimeType(compressedFile);
				const { data, error: uploadError } = await supabase.storage
					.from('post-media')
					.upload(fileName, compressedFile, { contentType });
				if (uploadError) throw uploadError;
				const { data: signedUrlData } = await supabase.storage
					.from('post-media')
					.createSignedUrl(data.path, 60 * 60 * 24 * 365);
				if (signedUrlData?.signedUrl) {
					urls.push(signedUrlData.signedUrl);
				}
				uploadProgress = { phase: 'uploading', progress: 90 + (i / selectedFiles.length) * 10, message: `File ${i + 1}/${selectedFiles.length} uploaded` };
			} catch (err) {
				console.error('Error uploading file:', err);
				
				// Enhanced error logging with context
				console.log('Upload error details:', {
					errorType: err?.constructor?.name,
					message: err instanceof Error ? err.message : String(err),
					fileSize: file.size,
					fileName: file.name,
					fileType: file.type,
					uploadIndex: i,
					totalFiles: selectedFiles.length
				});
				
				throw new Error(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
			}
		}
		uploadProgress = { phase: 'done', progress: 100, message: 'All files uploaded successfully' };
		return urls;
	}
	
	async function handleSubmit() {
		if (isSubmitting) return;
		if (!$session?.user?.email) {
			error = 'You must be logged in to post';
			return;
		}
		try {
			isSubmitting = true;
			error = '';
			let postData: any = {
				author_email: $session.user.email,
				author_id: $session.user.id,
				visibility: 'all'
			};
			
			if (mode === 'text') {
				if (!content.trim()) {
					error = 'Please enter some content';
					return;
				}
				postData = { ...postData, kind: 'post', body: content.trim() };
			} else if (mode === 'media') {
				if (selectedFiles.length === 0) {
					error = 'Please select at least one file';
					return;
				}
				const uploadedUrls = await uploadMediaFiles();
				postData = { ...postData, kind: 'post', body: content.trim() || null, media_urls: uploadedUrls };
			} else if (mode === 'poll') {
				if (!pollQuestion.trim()) {
					error = 'Please enter a poll question';
					return;
				}
				const validOptions = pollOptions.filter(opt => opt.trim()).map(opt => opt.trim());
				if (validOptions.length < 2) {
					error = 'Poll must have at least 2 options';
					return;
				}
				postData = { ...postData, kind: 'poll', body: pollQuestion.trim(), data: { type: 'options', options: validOptions } };
			} else if (mode === 'youtube') {
				if (!youtubeInfo) {
					error = 'Please enter a valid YouTube URL';
					return;
				}
				// ✅ Don’t save raw YouTube URL in body
				postData = { 
					...postData,
					kind: 'post',
					body: content.trim() || null,
					media_urls: [youtubeInfo.embedUrl]
				};
			}
			
			const { error: submitError } = await supabase.from('items').insert(postData as any);
			if (submitError) throw submitError;
			
			resetForm();
			onPostCreated?.();
		} catch (err) {
			console.error('Error creating post:', err);
			error = err instanceof Error ? err.message : 'Failed to create post. Please try again.';
		} finally {
			isSubmitting = false;
			uploadProgress = null;
		}
	}
	
	function handleCancel() {
		resetForm();
		onCancel?.();
	}
	
	$effect(() => {
		if (mode === 'youtube') {
			handleYouTubeUrlChange();
		}
	});
</script>

<div class="space-y-4" class:card={!embedded}>
	{#if !embedded}
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-900">Share with your family</h3>
			<button onclick={handleCancel} class="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Cancel">
				<X class="w-5 h-5" />
			</button>
		</div>
	{/if}

	<!-- Mode selector -->
	<div class="flex gap-2 border-b border-gray-200 pb-3">
		<button onclick={() => handleModeChange('text')} class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
			class:bg-primary-100={mode === 'text'} class:text-primary-700={mode === 'text'} class:text-gray-600={mode !== 'text'} class:hover:bg-gray-100={mode !== 'text'}>
			Text
		</button>
		<button onclick={() => handleModeChange('media')} class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
			class:bg-primary-100={mode === 'media'} class:text-primary-700={mode === 'media'} class:text-gray-600={mode !== 'media'} class:hover:bg-gray-100={mode !== 'media'}>
			<Camera class="w-4 h-4" aria-hidden="true" /> Photo/Video
		</button>
		<button onclick={() => handleModeChange('poll')} class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
			class:bg-primary-100={mode === 'poll'} class:text-primary-700={mode === 'poll'} class:text-gray-600={mode !== 'poll'} class:hover:bg-gray-100={mode !== 'poll'}>
			<BarChart3 class="w-4 h-4" aria-hidden="true" /> Poll
		</button>
		<button onclick={() => handleModeChange('youtube')} class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
			class:bg-primary-100={mode === 'youtube'} class:text-primary-700={mode === 'youtube'} class:text-gray-600={mode !== 'youtube'} class:hover:bg-gray-100={mode !== 'youtube'}>
			<Link2 class="w-4 h-4" aria-hidden="true" /> YouTube
		</button>
	</div>

	<!-- Text / Media / Poll / YouTube Inputs -->
	{#if mode === 'text'}
		<textarea id="text-content" bind:value={content} {placeholder} rows="4"
			class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"></textarea>
	{:else if mode === 'media'}
		<!-- Media upload UI -->
		<div class="space-y-3">
			<textarea id="media-caption" bind:value={content} placeholder="Add a caption (optional)..." rows="3"
				class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"></textarea>
			<input id="media-files" type="file" multiple accept="image/*,video/*" onchange={handleFileSelect}
				class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
			{#if selectedFiles.length > 0}
				<div class="space-y-1">
					{#each selectedFiles as file, index}
						<div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
							<span class="text-sm text-gray-700">{file.name}</span>
							<button onclick={() => removeFile(index)} class="text-red-500 hover:text-red-700" aria-label="Remove file">
								<X class="w-4 h-4" />
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else if mode === 'poll'}
		<!-- Poll UI -->
		<div class="space-y-3">
			<input type="text" bind:value={pollQuestion} placeholder="Ask a question..."
				class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
			{#each pollOptions as option, index}
				<div class="flex items-center gap-2">
					<input type="text" bind:value={pollOptions[index]} placeholder={`Option ${index + 1}`}
						class="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
					{#if pollOptions.length > 2}
						<button onclick={() => removePollOption(index)} class="text-red-500 hover:text-red-700"><Minus class="w-4 h-4" /></button>
					{/if}
				</div>
			{/each}
			<button onclick={addPollOption} disabled={pollOptions.length >= 6} class="text-sm text-primary-600 hover:text-primary-700"><Plus class="w-4 h-4" /> Add Option</button>
		</div>
	{:else if mode === 'youtube'}
		<!-- YouTube UI -->
		<div class="space-y-3">
			<input type="url" bind:value={youtubeUrl} placeholder="https://www.youtube.com/watch?v=..."
				class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
			{#if youtubeInfo}
				<div class="bg-gray-50 rounded-lg p-3">
					<p class="text-sm font-medium text-gray-700 mb-2">Video Preview:</p>
					<div class="aspect-video bg-gray-200 rounded-lg overflow-hidden">
						<img src={youtubeInfo.thumbnailUrl} alt="YouTube video thumbnail" class="w-full h-full object-cover" />
					</div>
				</div>
			{/if}
			<textarea bind:value={content} placeholder="Add a description (optional)..." rows="3"
				class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"></textarea>
		</div>
	{/if}

	<!-- Upload Progress -->
	{#if uploadProgress}
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm font-medium text-blue-800">{uploadProgress.message}</span>
				<span class="text-sm text-blue-600">{Math.round(uploadProgress.progress)}%</span>
			</div>
			<div class="w-full bg-blue-200 rounded-full h-2">
				<div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: {uploadProgress.progress}%"></div>
			</div>
		</div>
	{/if}

	<!-- Error Message -->
	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-3">
			<p class="text-sm text-red-700">{error}</p>
		</div>
	{/if}

	<!-- Submit Button -->
	<div class="flex justify-end">
		<button onclick={handleSubmit} disabled={isSubmitting}
			class="btn btn-primary disabled:opacity-50 flex items-center gap-2">
			{#if isSubmitting}
				<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
				{uploadProgress ? uploadProgress.message : 'Posting...'}
			{:else}
				<Send class="w-4 h-4" /> Post
			{/if}
		</button>
	</div>
</div>
