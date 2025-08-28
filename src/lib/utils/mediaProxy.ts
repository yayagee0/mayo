/**
 * Media Proxy Utilities
 * 
 * Utilities for converting Supabase storage paths to proxied URLs
 * to avoid OpaqueResponseBlocking issues in browsers.
 */

/**
 * Converts a Supabase storage path to a proxied URL
 * 
 * @param storagePath - The path in Supabase storage (e.g., "avatars/user-avatar.jpg")
 * @param bucket - The bucket name (defaults to "post-media")
 * @returns The proxied URL or null if invalid path
 */
export function getProxiedMediaUrl(storagePath: string | null, bucket: string = 'post-media'): string | null {
	if (!storagePath) return null;
	
	// Handle local avatar bank URLs (start with /avatars/)
	if (storagePath.startsWith('/avatars/')) {
		return storagePath; // Return as-is for local avatar bank
	}
	
	// Handle existing signed URLs - return as proxy URL instead
	if (storagePath.includes('supabase') && storagePath.includes('sign')) {
		console.warn('Converting legacy signed URL to proxy URL:', storagePath);
		// Try to extract the file path from the signed URL
		const match = storagePath.match(/\/storage\/v1\/object\/sign\/([^\/]+)\/(.+?)\?/);
		if (match) {
			const [, urlBucket, filePath] = match;
			return `/api/media/${urlBucket}/${filePath}`;
		}
		// If we can't parse it, return null to trigger fallback
		return null;
	}
	
	// Clean the storage path
	let cleanPath = storagePath.trim();
	
	// Remove leading slash if present
	if (cleanPath.startsWith('/')) {
		cleanPath = cleanPath.substring(1);
	}
	
	// Construct proxy URL
	return `/api/media/${bucket}/${cleanPath}`;
}

/**
 * Checks if a URL is a raw Supabase storage URL that should be proxied
 */
export function isRawSupabaseUrl(url: string): boolean {
	return url.includes('supabase') && (url.includes('.supabase.co') || url.includes('.supabase.in'));
}

/**
 * Validates that a URL is using the proxy instead of raw Supabase URLs
 */
export function isProxiedUrl(url: string): boolean {
	return url.startsWith('/api/media/') || url.startsWith('/avatars/');
}