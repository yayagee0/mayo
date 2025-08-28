# Mobile Upload Failure Investigation Report

## Summary
This report analyzes the media upload flow in the Mayo app to identify potential root causes for why uploads succeed on laptop but fail on mobile devices.

## Upload Flow Analysis

### 1. File Selection and Processing
**File**: `src/components/PostComposer.svelte` (lines 57-92)
- Uses HTML file input with `accept="image/*,video/*"`
- Processes HEIC files from iOS devices via dynamic import of `heic2any`
- Validates files using `validateMediaFile()` function

### 2. Media Compression
**File**: `src/lib/utils/mediaCompression.ts` (lines 19-61)
- Uses `browser-image-compression` library with 1MB size limit
- Fallback to original file if compression fails
- Uses Web Workers for better performance

### 3. Supabase Upload
**File**: `src/components/PostComposer.svelte` (lines 124-153)
- Uploads to `post-media` bucket
- Creates signed URLs for 1-year expiration
- Error handling throws generic "Failed to upload" message

---

## Potential Root Causes

### 1. MIME Type Detection Issues (HIGH PRIORITY)
**Files**: 
- `src/lib/utils/mediaCompression.ts` (lines 114-137, 142-175)
- `src/components/PostComposer.svelte` (line 67)

**Issue**: Mobile browsers often provide incorrect, missing, or non-standard MIME types for camera files.

**Evidence**:
- Fallback logic exists: `if (file.type.startsWith('image/'))` then check extensions
- Test cases show handling of empty MIME types: `{ type: '' }`
- Test for `application/octet-stream` MIME type

**Mobile Impact**: 
- iOS Safari may report `application/octet-stream` for camera photos
- Android Chrome may provide empty MIME types
- Mobile camera apps may use non-standard MIME types

**Behavior Difference**: Desktop file selectors typically provide correct MIME types, while mobile camera/gallery selections often don't.

---

### 2. HEIC Conversion Failures (HIGH PRIORITY)
**File**: `src/components/PostComposer.svelte` (lines 66-79)

**Issue**: iOS devices use HEIC format by default, conversion may fail on mobile browsers.

**Evidence**:
- Dynamic import of `heic2any` library
- Error handling: "Failed to convert HEIC image. Please try a different photo."
- Only checks `file.type === "image/heic"` or filename ending

**Mobile Impact**:
- iPhone photos are HEIC by default since iOS 11
- `heic2any` library may have issues in mobile browsers
- Memory constraints on mobile may cause conversion failures

**Behavior Difference**: iPhones produce HEIC files, laptops typically don't encounter this format.

---

### 3. Image Compression Memory Issues (HIGH PRIORITY)
**File**: `src/lib/utils/mediaCompression.ts` (lines 19-61)

**Issue**: Mobile browsers have memory constraints that may cause compression to fail.

**Evidence**:
- Uses `browser-image-compression` with Web Workers
- 1MB size limit and 1920px max dimension
- Fallback to original file if compression fails
- Option: `useWebWorker: true`

**Mobile Impact**:
- Mobile browsers have stricter memory limits
- High-resolution mobile photos (12MP+) consume significant memory
- Web Workers may fail on some mobile browsers
- Canvas operations (used by compression library) may fail

**Behavior Difference**: Desktop browsers have more available memory for image processing operations.

---

### 4. File Size and Upload Limits (MEDIUM PRIORITY)
**File**: `src/lib/utils/mediaCompression.ts` (lines 142-149)

**Issue**: Mobile photos are often larger and may exceed size limits.

**Evidence**:
- 100MB maximum file size limit
- Mobile cameras produce high-resolution images
- Video files from mobile can be very large

**Mobile Impact**:
- Modern mobile cameras produce 12MP+ photos (5-10MB each)
- 4K video recordings can quickly exceed 100MB
- Raw or ProRAW formats on iOS are much larger

**Behavior Difference**: Laptop users typically select already-processed images, mobile users often select fresh camera captures.

---

### 5. Auth Token Refresh Issues (MEDIUM PRIORITY)
**File**: `src/lib/stores/sessionStore.ts` (lines 9-18)

**Issue**: Mobile browsers may handle authentication differently, causing token expiration during upload.

**Evidence**:
- Simple session management without explicit token refresh
- Upload process can take significant time on mobile
- Auth state change listener exists but no explicit refresh logic

**Mobile Impact**:
- Mobile browsers may suspend background tabs
- Cellular connections have higher latency
- Long upload times may cause token expiration

**Behavior Difference**: Desktop uploads are typically faster and browsers are less likely to suspend sessions.

---

### 6. Service Worker Interference (MEDIUM PRIORITY)
**File**: `static/sw.js` (lines 46-75)

**Issue**: Service worker may interfere with Supabase uploads on mobile networks.

**Evidence**:
- Network-first strategy with cache fallback
- Skips Supabase URLs: `url.hostname.includes('supabase')`
- May still intercept related requests

**Mobile Impact**:
- Mobile networks have different connectivity patterns
- Cellular data may trigger unexpected cache behavior
- PWA installation changes request handling

**Behavior Difference**: Desktop typically uses more stable WiFi connections.

---

### 7. Network and CORS Issues (MEDIUM PRIORITY)
**File**: Service worker and Supabase configuration

**Issue**: Mobile networks and cellular providers may have different CORS/networking behavior.

**Evidence**:
- No explicit CORS configuration visible
- Reliance on Supabase default policies
- Mobile networks often use NAT and proxies

**Mobile Impact**:
- Cellular carriers may modify or proxy requests
- Different mobile browsers handle CORS differently
- Upload chunk size may need adjustment for mobile

**Behavior Difference**: Desktop WiFi connections are typically more direct and stable.

---

### 8. File Input Behavior Differences (LOW PRIORITY)
**File**: `src/components/PostComposer.svelte` (line 273)

**Issue**: Mobile file inputs behave differently and may provide different File objects.

**Evidence**:
- Standard HTML file input with `multiple accept="image/*,video/*"`
- No mobile-specific handling
- Uses `Array.from(input.files)`

**Mobile Impact**:
- Mobile may provide different file metadata
- iOS Photo Library integration may behave differently
- Android file picker variations across vendors

**Behavior Difference**: Desktop file dialogs are more standardized than mobile photo/file pickers.

---

### 9. Browser-Specific API Support (LOW PRIORITY)
**File**: `src/lib/utils/mediaCompression.ts` (Web Worker usage)

**Issue**: Mobile browsers may have limited support for certain APIs used in compression.

**Evidence**:
- Uses Web Workers for compression
- Canvas operations for image processing
- Dynamic imports for libraries

**Mobile Impact**:
- Some mobile browsers have limited Web Worker support
- iOS Safari has specific Canvas memory limits
- Dynamic imports may fail in some mobile contexts

**Behavior Difference**: Desktop browsers generally have more complete API support.

---

## Missing Error Details

### Current Error Handling
**File**: `src/components/PostComposer.svelte` (lines 146-149)

```typescript
} catch (err) {
    console.error('Error uploading file:', err);
    throw new Error(`Failed to upload ${file.name}`);
}
```

**Issue**: Generic error message doesn't provide specific failure details for debugging mobile-specific issues.

**Improvement Needed**: More granular error reporting to distinguish between:
- HEIC conversion failures
- Compression failures  
- Authentication failures
- Network failures
- Supabase storage failures

---

## Recommendations for Further Investigation

1. **Add Detailed Error Logging**: Capture specific error types and messages
2. **Mobile-Specific Testing**: Test on various mobile browsers and devices
3. **Network Condition Testing**: Test on cellular vs WiFi connections
4. **Memory Usage Monitoring**: Monitor memory usage during compression
5. **Token Validation**: Check auth token validity before upload
6. **Supabase Logs Review**: Examine server-side error logs
7. **Browser Console Analysis**: Compare mobile vs desktop browser console errors

---

## Files Requiring Attention

1. `src/components/PostComposer.svelte` - Main upload component
2. `src/lib/utils/mediaCompression.ts` - File processing and validation
3. `src/lib/stores/sessionStore.ts` - Authentication management
4. `static/sw.js` - Service worker that may interfere
5. `src/lib/supabase.ts` - Supabase client configuration

---

*This report represents a read-only analysis based on code inspection. Actual mobile testing and error log analysis would be required to confirm specific root causes.*