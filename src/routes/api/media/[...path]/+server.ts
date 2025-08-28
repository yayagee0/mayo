import { json, error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

/**
 * Media Proxy API Route
 * 
 * Proxies media files from Supabase Storage to avoid OpaqueResponseBlocking issues.
 * Accepts requests like /api/media/post-media/avatars/xyz.jpg and streams the file
 * back with proper headers.
 * 
 * Security: Only authenticated users can access media files.
 * Performance: Generates short-lived signed URLs (1h) and streams directly.
 */
export const GET: RequestHandler = async ({ params, request, url }) => {
	try {
		// Extract the full path from the dynamic route parameter
		const mediaPath = params.path;
		if (!mediaPath) {
			return error(400, 'Media path is required');
		}

		// Get current session to ensure user is authenticated
		const { data: { session }, error: sessionError } = await supabase.auth.getSession();
		if (sessionError || !session) {
			return error(401, 'Authentication required');
		}

		// Parse the path to extract bucket and file path
		// Expected format: post-media/path/to/file.jpg
		const pathParts = mediaPath.split('/');
		if (pathParts.length < 2) {
			return error(400, 'Invalid media path format');
		}

		const bucket = pathParts[0]; // e.g., "post-media"
		let filePath = pathParts.slice(1).join('/'); // e.g., "avatars/user-avatar.jpg"
		
		// Fix: Strip bucket prefix from filePath if present (prevents double bucket prefix)
		// This handles cases where Supabase upload returns data.path with bucket prefix included
		if (filePath.startsWith(bucket + '/')) {
			filePath = filePath.substring(bucket.length + 1);
			console.debug('Stripped duplicate bucket prefix from file path:', { original: pathParts.slice(1).join('/'), corrected: filePath });
		}

		// Validate bucket name (security measure)
		const allowedBuckets = ['post-media'];
		if (!allowedBuckets.includes(bucket)) {
			return error(403, 'Access denied to bucket');
		}

		// Generate a short-lived signed URL (1 hour expiry)
		const { data: signedUrlData, error: signedUrlError } = await supabase.storage
			.from(bucket)
			.createSignedUrl(filePath, 3600); // 1 hour

		if (signedUrlError || !signedUrlData?.signedUrl) {
			console.error('Error creating signed URL:', signedUrlError);
			return error(404, 'Media file not found');
		}

		// Fetch the file from Supabase Storage
		const response = await fetch(signedUrlData.signedUrl, {
			headers: {
				'User-Agent': 'Mayo-MediaProxy/1.0'
			}
		});

		if (!response.ok) {
			return error(response.status, 'Failed to fetch media file');
		}

		// Determine content type from the file extension or response headers
		const contentType = response.headers.get('content-type') || getContentTypeFromPath(filePath);
		
		// Get file size for Content-Length header
		const contentLength = response.headers.get('content-length');

		// Create response headers to prevent OpaqueResponseBlocking
		const headers = new Headers({
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=3600, immutable', // 1 hour cache
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type',
			'X-Content-Type-Options': 'nosniff',
			'Cross-Origin-Resource-Policy': 'cross-origin'
		});

		if (contentLength) {
			headers.set('Content-Length', contentLength);
		}

		// Stream the response body
		return new Response(response.body, {
			status: 200,
			headers
		});

	} catch (err) {
		console.error('Media proxy error:', err);
		return error(500, 'Internal server error');
	}
};

/**
 * Determines content type from file path extension
 */
function getContentTypeFromPath(filePath: string): string {
	const extension = filePath.toLowerCase().split('.').pop();
	
	switch (extension) {
		// Images
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
		case 'tif':
			return 'image/tiff';
		
		// Videos
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
		
		// Default fallback
		default:
			return 'application/octet-stream';
	}
}