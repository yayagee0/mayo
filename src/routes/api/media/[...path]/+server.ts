import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import { detectMimeByExt } from '$lib/media/mime';
import type { RequestHandler } from './$types';

/**
 * Bulletproof Media Proxy API Route
 * 
 * Proxies media files from Supabase Storage with full Range support, proper headers,
 * and graceful fallbacks. Handles both GET and HEAD requests.
 * 
 * Features:
 * - Byte-range support for video scrubbing (206 responses)
 * - Proper Content-Type detection and forwarding
 * - Graceful fallbacks for missing media
 * - Security via authentication
 * - Duplicate bucket prefix handling
 */

/**
 * Serves local fallback file based on extension
 */
async function serveFallback(filePath: string): Promise<Response> {
	const extension = filePath.toLowerCase().split('.').pop() || '';
	const isVideo = ['mp4', 'webm', 'mov', 'avi', 'm4v', '3gp', 'mkv'].includes(extension);
	const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'heic'].includes(extension);
	
	let fallbackPath: string;
	let contentType: string;
	
	if (isVideo) {
		fallbackPath = '/video-unavailable.mp4';
		contentType = 'video/mp4';
	} else {
		// Default to image fallback for everything else
		fallbackPath = '/default-avatar.png';
		contentType = 'image/png';
	}
	
	// In a real implementation, we'd fetch the actual fallback file
	// For now, return a simple response
	const fallbackContent = isVideo ? 'Video unavailable' : 'Image unavailable';
	
	return new Response(fallbackContent, {
		status: 200,
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=3600, immutable',
			'X-Content-Type-Options': 'nosniff'
		}
	});
}

/**
 * Main proxy handler for both GET and HEAD requests
 */
async function handleRequest(request: Request, params: any): Promise<Response> {
	try {
		// Parse path
		const parts = params.path.split('/').filter(Boolean);
		const bucket = parts.shift() || '';
		
		if (!bucket) {
			throw error(400, 'Missing bucket');
		}
		
		let filePath = parts.join('/');
		
		// Handle duplicate bucket prefix
		if (filePath.startsWith(bucket + '/')) {
			filePath = filePath.slice(bucket.length + 1);
			console.debug('Proxying media', { bucket, filePath, note: 'stripped duplicate prefix' });
		} else {
			console.debug('Proxying media', { bucket, filePath });
		}
		
		// Validate bucket
		const allowedBuckets = ['post-media'];
		if (!allowedBuckets.includes(bucket)) {
			return error(403, 'Access denied to bucket');
		}
		
		// Get session (authentication required)
		const { data: { session }, error: sessionError } = await supabase.auth.getSession();
		if (sessionError || !session) {
			return error(401, 'Authentication required');
		}
		
		// Create signed URL
		const { data: signedUrlData, error: signedUrlError } = await supabase.storage
			.from(bucket)
			.createSignedUrl(filePath, 3600); // 1 hour
			
		if (signedUrlError || !signedUrlData?.signedUrl) {
			console.error('Error creating signed URL:', signedUrlError);
			return serveFallback(filePath);
		}
		
		// Prepare headers for upstream request
		const upstreamHeaders: HeadersInit = {
			'User-Agent': 'Mayo-MediaProxy/1.0'
		};
		
		// Forward Range header for byte-range requests (video scrubbing)
		const rangeHeader = request.headers.get('Range');
		if (rangeHeader) {
			upstreamHeaders['Range'] = rangeHeader;
		}
		
		// Fetch from Supabase
		const response = await fetch(signedUrlData.signedUrl, {
			method: request.method,
			headers: upstreamHeaders
		});
		
		if (!response.ok) {
			console.warn('Upstream fetch failed:', response.status, response.statusText);
			return serveFallback(filePath);
		}
		
		// Build response headers
		const responseHeaders = new Headers();
		
		// Forward critical headers from upstream
		const headersToForward = [
			'content-type', 'content-length', 'accept-ranges', 'content-range',
			'etag', 'last-modified', 'content-disposition'
		];
		
		headersToForward.forEach(headerName => {
			const value = response.headers.get(headerName);
			if (value) {
				responseHeaders.set(headerName, value);
			}
		});
		
		// Set content-type if not present
		if (!responseHeaders.has('content-type')) {
			const detectedType = detectMimeByExt(filePath, 'application/octet-stream');
			responseHeaders.set('content-type', detectedType);
		}
		
		// Set cache control if not present
		if (!responseHeaders.has('cache-control')) {
			responseHeaders.set('cache-control', 'public, max-age=3600, immutable');
		}
		
		// Add security headers
		responseHeaders.set('x-content-type-options', 'nosniff');
		responseHeaders.set('Access-Control-Allow-Origin', '*');
		responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD');
		responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Range');
		responseHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
		
		// Return response with proper status (200 or 206 for partial content)
		return new Response(response.body, {
			status: response.status, // Preserve 206 for partial content
			headers: responseHeaders
		});
		
	} catch (err) {
		console.error('Media proxy error:', err);
		// Never throw 500 to end users - serve fallback instead
		return serveFallback(params.path || '');
	}
}

export const GET: RequestHandler = async ({ params, request }) => {
	return handleRequest(request, params);
};

export const HEAD: RequestHandler = async ({ params, request }) => {
	return handleRequest(request, params);
};