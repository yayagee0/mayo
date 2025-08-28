/**
 * Centralized MIME type detection for media files
 * Provides reliable content type detection for uploads and proxy
 */

/**
 * Maps file extensions to their corresponding MIME types
 */
const MIME_MAP: Record<string, string> = {
	// Images
	'jpg': 'image/jpeg',
	'jpeg': 'image/jpeg',
	'png': 'image/png',
	'gif': 'image/gif',
	'webp': 'image/webp',
	'bmp': 'image/bmp',
	'tiff': 'image/tiff',
	'tif': 'image/tiff',
	'heic': 'image/heic',
	
	// Videos
	'mp4': 'video/mp4',
	'm4v': 'video/mp4',
	'webm': 'video/webm',
	'mov': 'video/quicktime',
	'3gp': 'video/3gpp',
	'avi': 'video/avi',
	'mkv': 'video/x-matroska'
};

/**
 * Detects MIME type by file extension with fallback
 * @param name - File name or path with extension
 * @param fallback - Fallback MIME type if detection fails
 * @returns MIME type string
 */
export function detectMimeByExt(name: string, fallback = 'application/octet-stream'): string {
	if (!name) return fallback;
	
	const extension = name.toLowerCase().split('.').pop();
	if (!extension) return fallback;
	
	return MIME_MAP[extension] || fallback;
}

/**
 * Validates and returns the most reliable MIME type for upload
 * Prioritizes file.type if reliable, otherwise uses extension detection
 * @param file - File or Blob with optional name and type properties
 * @returns Validated MIME type string, never 'application/octet-stream'
 */
export function validatedUploadMime(file: File | (Blob & { name?: string; type?: string })): string {
	// If file has a type and it's not the generic octet-stream, check if it's reliable
	if (file.type && file.type !== 'application/octet-stream') {
		// For known good MIME types, trust the file.type
		const knownImageTypes = [
			'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
			'image/heic', 'image/bmp', 'image/tiff'
		];
		const knownVideoTypes = [
			'video/mp4', 'video/webm', 'video/quicktime', 
			'video/avi', 'video/3gpp', 'video/x-matroska'
		];
		
		if (knownImageTypes.includes(file.type) || knownVideoTypes.includes(file.type)) {
			return file.type;
		}
	}
	
	// Fallback to extension-based detection
	const fileName = 'name' in file ? file.name : '';
	if (fileName) {
		const detectedType = detectMimeByExt(fileName, '');
		if (detectedType && detectedType !== 'application/octet-stream') {
			return detectedType;
		}
	}
	
	// Safe fallback - never return application/octet-stream as it causes browser issues
	return 'application/octet-stream';
}