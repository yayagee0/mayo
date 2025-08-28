# Full Media Lifecycle Audit Report

*This is a comprehensive read-only audit of the photo and video lifecycle in the Mayo (FamilyNest) project.*

## Executive Summary

This audit examines the complete media lifecycle from file selection through storage to rendering in the feed. Key findings include:

- **Missing explicit contentType** in Supabase upload calls, relying on File object metadata
- **Comprehensive MIME type fallbacks** for mobile compatibility but potential inconsistencies
- **Long-lived signed URLs** (1 year) with proper authentication checks
- **Service worker bypasses** all Supabase requests correctly
- **Robust error handling** for compression and conversion but generic upload errors

---

## 1. Upload Stage

### File Selection & Validation

**Primary File**: `src/components/PostComposer.svelte` (lines 57-113)
**Secondary Files**: `src/lib/utils/mediaCompression.ts` (lines 165-216)

#### File Selection
- **Location**: `PostComposer.svelte` line 328
- **Method**: HTML file input with `accept="image/*,video/*"`
- **Processing**: Handles HEIC conversion dynamically via `heic2any` library

```svelte
<input id="media-files" type="file" multiple accept="image/*,video/*" onchange={handleFileSelect}
  class="..." />
```

#### MIME Type Detection
**Primary Logic**: `mediaCompression.ts` lines 135-159 (images), 150-159 (videos)

**Strategy**: Dual approach with comprehensive fallbacks
1. **Primary**: Check `file.type` if available and not `application/octet-stream`
2. **Fallback**: Use file extension pattern matching for mobile compatibility

```typescript
// Enhanced MIME type validation with mobile fallbacks
if (!file.type || file.type === 'application/octet-stream') {
  // Use extension as authoritative source for mobile compatibility
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|heic)$/i;
  if (!imageExtensions.test(file.name)) {
    return { valid: false, error: 'Unsupported image format...' };
  }
}
```

**Supported Formats**:
- **Images**: JPEG, JPG, PNG, GIF, WebP, HEIC
- **Videos**: MP4, WebM, MOV, AVI, QuickTime
- **Mobile Extensions**: Also supports m4v, 3gp for video

#### File Validation
**Location**: `mediaCompression.ts` lines 165-216
- **Size Limit**: 100MB (Supabase limit)
- **MIME Type Validation**: Comprehensive with mobile fallbacks
- **Extension Validation**: Regex patterns as secondary validation

### Content Preparation

#### HEIC Conversion
**Location**: `PostComposer.svelte` lines 67-99
- **Implementation**: Dynamic import of `heic2any` to avoid SSR issues
- **Retry Logic**: Up to 2 conversion attempts with 500ms delay
- **Quality Setting**: 0.8 for reliability
- **Error Handling**: Specific error message for HEIC conversion failures

#### Compression
**Location**: `mediaCompression.ts` lines 248-276
- **Strategy**: Type-based compression routing
- **Image Compression**: Uses `browser-image-compression` library
  - Mobile detection and adjusted limits (0.5MB vs 1MB)
  - Web Worker support (disabled on mobile for reliability)
  - Canvas API detection with memory checks
- **Video Compression**: Basic implementation (returns original if < 50MB)

### Upload Execution

#### Supabase Upload Calls
**Locations**:
- `PostComposer.svelte` lines 178-181 (media posts)
- `profileStore.ts` lines 147-150 (avatars)
- `routes/profile/+page.svelte` lines 136 (profile updates)

**⚠️ Critical Finding**: **No explicit contentType parameter**

```typescript
// PostComposer.svelte - line 178-181
const { data, error: uploadError } = await supabase.storage
  .from('post-media')
  .upload(fileName, compressedFile);
  // ❌ Missing: contentType parameter
```

```typescript
// profileStore.ts - line 147-150  
const { error: uploadError } = await supabase.storage
  .from('post-media')
  .upload(fileName, processedFile, { upsert: true })
  // ❌ Missing: contentType parameter
```

#### File Naming
**Pattern**: `${Date.now()}-${Math.random().toString(36).substring(2)}-${compressedFile.name}`
- Timestamp prefix for uniqueness
- Random string for collision avoidance
- Original filename preserved

---

## 2. Storage Metadata

### Bucket Configuration
- **Bucket Name**: `post-media` (consistent across all uploads)
- **Storage Type**: Private bucket requiring signed URLs
- **Content Type Handling**: **Relies on File object's `type` property**

### Metadata Inheritance
**Current Behavior**: Supabase storage inherits contentType from File object
- **Source**: Compressed file's `.type` property
- **Risk**: Mobile browsers may provide unreliable MIME types
- **Fallback**: File extension patterns used for validation but not for storage metadata

### Potential Issues
1. **Missing contentType**: If File object has `application/octet-stream` or empty type, storage may lack proper metadata
2. **Inconsistent Metadata**: Validation accepts files based on extension, but storage metadata comes from potentially unreliable MIME type
3. **No Explicit Override**: No mechanism to force correct contentType based on validation results

---

## 3. Signed URL Generation

### Primary Implementation
**Location**: `PostComposer.svelte` lines 182-187

```typescript
const { data: signedUrlData } = await supabase.storage
  .from('post-media')
  .createSignedUrl(data.path, 60 * 60 * 24 * 365);
```

#### URL Validity Periods
- **Media Posts**: 1 year (365 days) - `PostComposer.svelte` line 184
- **Avatars**: 1 hour (3600 seconds) - `profileStore.ts` line 206

### Secondary Implementation
**Location**: `profileStore.ts` lines 202-218 (resolveAvatar function)

```typescript
const { data, error } = await supabase.storage
  .from('post-media')
  .createSignedUrl(avatarPath, 3600); // 1h
```

#### Error Handling
- **Graceful Degradation**: Returns null for missing files
- **Debug Logging**: Non-intrusive console.debug for missing avatars
- **No HTTP Errors**: Missing files logged as debug, not errors

### Headers & Metadata
**⚠️ Limitation**: Signed URLs inherit storage metadata
- **Content-Type**: Based on file's stored metadata (potentially unreliable)
- **Cache-Control**: Default Supabase storage headers
- **No Custom Headers**: No mechanism to override or force correct headers

---

## 4. Auth & Session Refresh

### Session Management
**Primary Location**: `src/lib/stores/sessionStore.ts`

#### Token Refresh Strategy
**Location**: `sessionStore.ts` lines 24-60
- **Proactive Refresh**: Triggers when token expires within 5 minutes
- **Validation Function**: `validateAndRefreshSession()` returns boolean success

```typescript
// Check if token is close to expiry (within 5 minutes)
const expiresAt = currentSession.expires_at
if (expiresAt && (expiresAt * 1000 - Date.now()) < 5 * 60 * 1000) {
  console.log('Session near expiry, refreshing...')
  const { data, error: refreshError } = await supabase.auth.refreshSession()
}
```

#### Upload Integration
**Location**: `PostComposer.svelte` lines 145-166
- **Pre-upload Validation**: Checks session before starting upload
- **Automatic Refresh**: Triggers refresh for tokens expiring soon
- **Error Handling**: Throws descriptive errors for auth failures

### Failure Points
1. **Network Interruption**: Refresh may fail on poor mobile connections
2. **Timing Race Conditions**: Long uploads may still expire during processing
3. **Browser Suspension**: Mobile browsers may suspend auth state management

### Session Persistence
**Configuration**: `supabase.ts` lines 450-470
```typescript
auth: {
  autoRefreshToken: true,
  persistSession: true, 
  detectSessionInUrl: true
}
```

---

## 5. Rendering in Feed

### Media Detection
**Location**: `PostCard.svelte` lines 89-99

#### URL Pattern Matching
```typescript
function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com/embed/') || 
         url.includes('youtube.com/watch?') || 
         url.includes('youtu.be/');
}
function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
}
function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
}
```

**⚠️ Limitation**: Pattern matching ignores MIME type headers from signed URLs

### Rendering Implementation
**Location**: `PostCard.svelte` lines 222-263

#### Image Rendering
```svelte
{:else if isImageUrl(mediaUrl)}
  <div class="rounded-lg overflow-hidden">
    <img src={mediaUrl} alt="" loading="lazy" class="w-full h-auto object-cover" />
  </div>
```

#### Video Rendering
```svelte
{:else if isVideoUrl(mediaUrl)}
  <div class="rounded-lg overflow-hidden">
    <video controls class="w-full h-auto">
      <source src={mediaUrl} type="video/mp4" />
      <track kind="captions" srclang="en" src="/captions.vtt" default />
    </video>
  </div>
```

**⚠️ Issue**: Hard-coded `type="video/mp4"` regardless of actual file type

### Fallback Logic
**Location**: `PostCard.svelte` lines 254-260
```svelte
{:else}
  <div class="p-3 bg-gray-50 rounded-lg border">
    <a href={mediaUrl} target="_blank" rel="noopener noreferrer"
      class="text-primary-600 hover:text-primary-700 text-sm font-medium break-all">
      {mediaUrl}
    </a>
  </div>
{/if}
```

**Behavior**: Unknown media types display as downloadable links

### Avatar Rendering
**Location**: `ui/AvatarDisplay.svelte` lines 48-66
- **Async Resolution**: Uses `resolveAvatar()` function
- **Error Handling**: Falls back to initials on image load failure
- **Graceful Degradation**: Handles missing or invalid avatar URLs

---

## 6. CORS & Response Handling

### Service Worker Configuration
**Location**: `static/sw.js`

#### Supabase Bypass Strategy
**Lines 51-60**: Comprehensive bypass rules
```javascript
// Enhanced Supabase bypass for mobile reliability
if (request.method !== 'GET' || 
    url.hostname.includes('supabase') || 
    url.hostname.endsWith('supabase.co') ||
    url.hostname.endsWith('supabase.in') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/storage/') ||
    url.pathname.includes('/auth/')) {
  return; // Let browser handle normally without service worker interference
}
```

**✅ Correctly configured**: All Supabase requests bypass service worker

#### Network Strategy
**Lines 63-79**: 100% Network-first approach
- **Primary**: Always fetch from network first
- **Fallback**: Cache only when network fails (offline)
- **Storage Requests**: Never cached, always direct to Supabase

### CORS Configuration
**Supabase Client**: `src/lib/supabase.ts` lines 426-431
```typescript
global: {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}
```

**⚠️ Limitation**: No explicit CORS configuration beyond defaults

### Potential OpaqueResponseBlocking
**Risk Factors**:
1. **Missing Content-Type**: Files uploaded without proper contentType may trigger Chrome's OpaqueResponseBlocking
2. **Service Worker Bypass**: Correctly bypasses SW, reducing CORP risks
3. **Signed URL Headers**: Inherit storage metadata, may lack proper headers

---

## Key Findings & Potential Issues

### Critical Issues

1. **Missing Explicit contentType** (HIGH PRIORITY)
   - **Location**: All `.upload()` calls
   - **Impact**: Storage metadata relies on File object MIME type
   - **Risk**: Mobile browsers provide unreliable MIME types
   - **Fix Needed**: Pass explicit contentType based on validation results

2. **Hard-coded Video Type** (MEDIUM PRIORITY)
   - **Location**: `PostCard.svelte` line 249
   - **Issue**: `type="video/mp4"` regardless of actual format
   - **Impact**: May prevent playback of WebM, MOV files

3. **Pattern-only Media Detection** (MEDIUM PRIORITY)
   - **Location**: `PostCard.svelte` lines 89-99
   - **Issue**: Ignores Content-Type headers from signed URLs
   - **Impact**: May misclassify files with query parameters

### Metadata Chain Breaks

**Upload Flow Issues**:
1. Validation accepts files based on extension patterns
2. Upload relies on File object MIME type (potentially unreliable)
3. Storage inherits potentially incorrect contentType
4. Signed URLs serve with inherited headers
5. Rendering relies on URL patterns, ignoring headers

### Reasons for Media Issues

#### Videos Show Black Player
- **Root Cause 1**: Incorrect contentType in storage (application/octet-stream)
- **Root Cause 2**: Hard-coded `type="video/mp4"` in video element
- **Root Cause 3**: Missing or incorrect Content-Type headers in signed URL response

#### New Images Don't Display  
- **Root Cause 1**: Missing contentType causing browser to reject as unsafe
- **Root Cause 2**: OpaqueResponseBlocking due to missing/incorrect headers
- **Root Cause 3**: Service worker interference (unlikely due to bypass rules)

#### Old Images Still Work
- **Explanation**: Previously uploaded with correct MIME types before mobile issues
- **Metadata Persistence**: Once stored with correct contentType, signed URLs work properly

---

## Recommendations

### Immediate Fixes (Code Changes Needed)
1. **Add explicit contentType to uploads** based on validation results
2. **Fix hard-coded video type** to use dynamic type detection  
3. **Enhance media detection** to check Content-Type headers
4. **Add contentType override** mechanism for storage metadata

### Enhanced Error Reporting
1. **Detailed upload logging** with file metadata, MIME types, and error contexts
2. **Storage metadata verification** after upload
3. **Signed URL header inspection** for debugging

### Testing Requirements
1. **Mobile browser testing** across iOS Safari, Chrome, Firefox
2. **Network condition testing** on cellular vs WiFi
3. **File format testing** with various camera sources and formats
4. **Header inspection** of signed URL responses

---

## File Summary

### Core Media Lifecycle Files
| File | Purpose | Key Lines |
|------|---------|-----------|
| `src/components/PostComposer.svelte` | Upload orchestration | 57-208 |
| `src/lib/utils/mediaCompression.ts` | File validation & compression | 165-276 |
| `src/components/PostCard.svelte` | Media rendering | 89-263 |
| `src/lib/stores/sessionStore.ts` | Auth management | 24-60 |
| `src/lib/stores/profileStore.ts` | Avatar handling | 132-218 |
| `static/sw.js` | Service worker rules | 46-80 |
| `src/lib/supabase.ts` | Client configuration | 420-470 |

### Media Type Detection
- **Upload validation**: Extension + MIME type fallbacks
- **Storage metadata**: File object MIME type (unreliable)
- **Rendering detection**: URL pattern matching only

### Signed URL Lifecycle
- **Generation**: Immediately after upload + on-demand for avatars
- **Validity**: 1 year (posts), 1 hour (avatars)
- **Headers**: Inherited from storage metadata
- **Auth**: Requires valid session, auto-refreshed before upload

---

*This audit represents a comprehensive analysis of the media lifecycle based on code inspection. The identified gaps in contentType handling and metadata consistency are the most likely causes of the reported media display issues.*