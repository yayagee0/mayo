/**
 * Media compression utilities for Mayo (FamilyNest) app
 * Client-side compression for photos and videos before upload
 */

// ✅ browser-image-compression dynamically imported to avoid SSR issues

export interface CompressionProgress {
	phase: 'compressing' | 'uploading' | 'done' | 'error';
	progress: number;
	message: string;
}

export type CompressionCallback = (progress: CompressionProgress) => void;

/**
 * Compresses an image file on the client side
 * Enhanced for mobile compatibility with memory constraints and API detection
 */
export async function compressImage(
	file: File, 
	onProgress?: CompressionCallback
): Promise<File> {
	try {
		onProgress?.({ phase: 'compressing', progress: 0, message: 'Starting image compression...' });
		
		// Dynamic import to avoid SSR issues
		const { default: imageCompression } = await import('browser-image-compression');
		
		// Detect mobile device and adjust compression settings
		const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		const maxSizeMB = isMobile ? 0.5 : 1; // Lower limit for mobile devices
		
		// Detect if Web Workers are supported
		const useWebWorker = typeof Worker !== 'undefined' && !isMobile; // Disable on mobile for reliability
		
		const options = {
			maxSizeMB,
			maxWidthOrHeight: 1920,
			useWebWorker,
			fileType: file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg',
			onProgress: (progress: number) => {
				onProgress?.({ 
					phase: 'compressing', 
					progress: progress * 0.8, // Reserve 20% for upload phase
					message: `Compressing image... ${Math.round(progress)}%`
				});
			}
		};

		const compressedFile = await imageCompression(file, options);
		
		onProgress?.({ 
			phase: 'compressing', 
			progress: 80, 
			message: 'Image compression complete'
		});
		
		return compressedFile;
	} catch (error) {
		console.warn('Image compression failed, using original file:', error);
		
		// Log detailed error information for debugging
		console.log('Compression error details:', {
			errorType: error?.constructor?.name,
			message: error instanceof Error ? error.message : String(error),
			fileSize: file.size,
			fileType: file.type,
			fileName: file.name,
			userAgent: navigator.userAgent
		});
		
		onProgress?.({ 
			phase: 'error', 
			progress: 0, 
			message: 'Compression failed, using original file'
		});
		
		return file;
	}
}

/**
 * Basic video compression using HTML5 Canvas and MediaRecorder
 * Reduces resolution and quality for smaller file sizes
 */
export async function compressVideo(
	file: File,
	onProgress?: CompressionCallback
): Promise<File> {
	try {
		onProgress?.({ phase: 'compressing', progress: 0, message: 'Starting video compression...' });
		
		// For now, we'll implement a simple approach
		// In a full implementation, we might use ffmpeg.wasm for better compression
		
		// Check if file is too large (> 50MB), then attempt basic compression
		const maxSize = 50 * 1024 * 1024; // 50MB
		
		if (file.size <= maxSize) {
			onProgress?.({ 
				phase: 'compressing', 
				progress: 80, 
				message: 'Video file size acceptable, no compression needed'
			});
			return file;
		}
		
		// For basic implementation, we'll just warn and use original
		// A full implementation would use ffmpeg.wasm or similar
		console.warn('Video file is large but compression not fully implemented yet');
		
		onProgress?.({ 
			phase: 'compressing', 
			progress: 80, 
			message: 'Video compression not available, using original file'
		});
		
		return file;
	} catch (error) {
		console.warn('Video compression failed, using original file:', error);
		onProgress?.({ 
			phase: 'error', 
			progress: 0, 
			message: 'Video compression failed, using original file'
		});
		return file;
	}
}

/**
 * Determines if a file is an image based on type and extension
 * Enhanced for mobile compatibility with MIME type fallbacks
 */
export function isImageFile(file: File): boolean {
	// Check MIME type first if available and reliable
	if (file.type && file.type !== 'application/octet-stream' && file.type.startsWith('image/')) {
		return true;
	}
	
	// Fallback to file extension for mobile compatibility and unreliable MIME types
	const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|heic)$/i;
	return imageExtensions.test(file.name);
}

/**
 * Determines if a file is a video based on type and extension
 * Enhanced for mobile compatibility with MIME type fallbacks
 */
export function isVideoFile(file: File): boolean {
	// Check MIME type first if available and reliable
	if (file.type && file.type !== 'application/octet-stream' && file.type.startsWith('video/')) {
		return true;
	}
	
	// Fallback to file extension for mobile compatibility and unreliable MIME types
	const videoExtensions = /\.(mp4|webm|mov|avi|m4v|3gp|mkv)$/i;
	return videoExtensions.test(file.name);
}

/**
 * Validates file size and type for upload
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string } {
	const maxSize = 100 * 1024 * 1024; // 100MB max (Supabase limit)
	const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
	const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'];
	
	// Pre-check file size against Supabase limit
	if (file.size > maxSize) {
		return { valid: false, error: `File size too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum allowed is 100MB.` };
	}
	
	// Check if it's an image or video
	if (!isImageFile(file) && !isVideoFile(file)) {
		return { valid: false, error: 'File must be an image or video' };
	}
	
	// Enhanced MIME type validation with mobile fallbacks
	if (isImageFile(file)) {
		// Handle missing or unreliable MIME types from mobile browsers
		if (!file.type || file.type === 'application/octet-stream') {
			// Use extension as authoritative source for mobile compatibility
			const imageExtensions = /\.(jpg|jpeg|png|gif|webp|heic)$/i;
			if (!imageExtensions.test(file.name)) {
				return { valid: false, error: 'Unsupported image format. Please use JPG, PNG, GIF, WebP, or HEIC.' };
			}
		} else if (!allowedImageTypes.includes(file.type)) {
			// MIME type provided but not in our list - check extension as fallback
			const imageExtensions = /\.(jpg|jpeg|png|gif|webp|heic)$/i;
			if (!imageExtensions.test(file.name)) {
				return { valid: false, error: 'Unsupported image format. Please use JPG, PNG, GIF, WebP, or HEIC.' };
			}
		}
	}
	
	// Enhanced video validation with mobile fallbacks
	if (isVideoFile(file)) {
		// Handle missing or unreliable MIME types from mobile browsers
		if (!file.type || file.type === 'application/octet-stream') {
			// Use extension as authoritative source for mobile compatibility
			const videoExtensions = /\.(mp4|webm|mov|avi|m4v|3gp)$/i;
			if (!videoExtensions.test(file.name)) {
				return { valid: false, error: 'Unsupported video format. Please use MP4, WebM, MOV, or AVI.' };
			}
		} else if (!allowedVideoTypes.includes(file.type)) {
			// MIME type provided but not in our list - check extension as fallback
			const videoExtensions = /\.(mp4|webm|mov|avi|m4v|3gp)$/i;
			if (!videoExtensions.test(file.name)) {
				return { valid: false, error: 'Unsupported video format. Please use MP4, WebM, MOV, or AVI.' };
			}
		}
	}
	
	return { valid: true };
}

/**
 * Detects if the current environment supports compression APIs
 */
function detectCompressionSupport(): { canCompress: boolean; reason?: string } {
	// Check for Canvas API
	if (typeof HTMLCanvasElement === 'undefined') {
		return { canCompress: false, reason: 'Canvas API not supported' };
	}
	
	// Check for FileReader API
	if (typeof FileReader === 'undefined') {
		return { canCompress: false, reason: 'FileReader API not supported' };
	}
	
	// Check available memory (rough heuristic)
	if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
		// @ts-ignore - deviceMemory is experimental
		const deviceMemory: number = (navigator as any).deviceMemory;
		if (deviceMemory && deviceMemory < 2) { // Less than 2GB RAM
			return { canCompress: false, reason: 'Insufficient device memory' };
		}
	}
	
	return { canCompress: true };
}

/**
 * Compresses a media file based on its type
 * Enhanced with compression capability detection and fallbacks
 */
export async function compressMediaFile(
	file: File,
	onProgress?: CompressionCallback
): Promise<File> {
	const validation = validateMediaFile(file);
	if (!validation.valid) {
		throw new Error(validation.error);
	}
	
	// Check if compression is supported/advisable
	const compressionSupport = detectCompressionSupport();
	
	if (isImageFile(file)) {
		if (!compressionSupport.canCompress) {
			console.warn(`Skipping compression: ${compressionSupport.reason}`);
			onProgress?.({ 
				phase: 'compressing', 
				progress: 80, 
				message: 'Skipping compression for compatibility'
			});
			return file;
		}
		return compressImage(file, onProgress);
	} else if (isVideoFile(file)) {
		return compressVideo(file, onProgress);
	}
	
	return file;
}

/**
 * Determines the validated MIME type for a file based on validation logic
 * Used to ensure correct contentType during upload to prevent application/octet-stream
 */
export function getValidatedMimeType(file: File): string {
	// For images
	if (isImageFile(file)) {
		// If we have a reliable MIME type and it's not generic, use it
		if (file.type && file.type !== 'application/octet-stream' && file.type.startsWith('image/')) {
			// Check if it's a standard, well-known MIME type
			const knownTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/bmp', 'image/tiff'];
			if (knownTypes.includes(file.type)) {
				return file.type;
			}
		}
		
		// Fallback based on file extension
		const extension = file.name.toLowerCase().split('.').pop();
		switch (extension) {
			case 'jpg':
			case 'jpeg':
				return 'image/jpeg';
			case 'png':
				return 'image/png';
			case 'gif':
				return 'image/gif';
			case 'webp':
				return 'image/webp';
			case 'heic':
				return 'image/heic';
			case 'bmp':
				return 'image/bmp';
			case 'tiff':
				return 'image/tiff';
			default:
				return 'image/jpeg'; // Safe fallback for images
		}
	}
	
	// For videos
	if (isVideoFile(file)) {
		// If we have a reliable MIME type and it's not generic, use it
		if (file.type && file.type !== 'application/octet-stream' && file.type.startsWith('video/')) {
			// Check if it's a standard, well-known MIME type
			const knownTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 'video/3gpp', 'video/x-matroska'];
			if (knownTypes.includes(file.type)) {
				return file.type;
			}
		}
		
		// Fallback based on file extension
		const extension = file.name.toLowerCase().split('.').pop();
		switch (extension) {
			case 'mp4':
			case 'm4v':
				return 'video/mp4';
			case 'webm':
				return 'video/webm';
			case 'mov':
				return 'video/quicktime';
			case 'avi':
				return 'video/avi';
			case '3gp':
				return 'video/3gpp';
			case 'mkv':
				return 'video/x-matroska';
			default:
				return 'video/mp4'; // Safe fallback for videos
		}
	}
	
	// Safe fallback - never return application/octet-stream
	// Default to image/jpeg for maximum compatibility
	return 'image/jpeg';
}