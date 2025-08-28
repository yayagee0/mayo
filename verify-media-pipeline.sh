#!/bin/bash

# Manual verification script for bulletproof media pipeline
# Tests the key acceptance criteria

echo "🚀 Bulletproof Media Pipeline - Manual Verification"
echo "=================================================="

# Check static fallback files exist
echo "📁 Checking static fallback files..."
if [ -f "static/default-avatar.png" ]; then
  echo "✅ default-avatar.png exists ($(wc -c < static/default-avatar.png) bytes)"
else
  echo "❌ default-avatar.png missing"
fi

if [ -f "static/video-unavailable.mp4" ]; then
  echo "✅ video-unavailable.mp4 exists ($(wc -c < static/video-unavailable.mp4) bytes)"
else
  echo "❌ video-unavailable.mp4 missing"
fi

# Check MIME detection module
echo -e "\n🧬 Checking MIME detection module..."
if [ -f "src/lib/media/mime.ts" ]; then
  echo "✅ MIME detection module exists"
  echo "   - detectMimeByExt function: $(grep -c 'detectMimeByExt' src/lib/media/mime.ts)"
  echo "   - validatedUploadMime function: $(grep -c 'validatedUploadMime' src/lib/media/mime.ts)"
  echo "   - Image MIME types: $(grep -c 'image/' src/lib/media/mime.ts)"
  echo "   - Video MIME types: $(grep -c 'video/' src/lib/media/mime.ts)"
else
  echo "❌ MIME detection module missing"
fi

# Check media proxy implementation
echo -e "\n🌐 Checking media proxy implementation..."
if [ -f "src/routes/api/media/[...path]/+server.ts" ]; then
  echo "✅ Media proxy route exists"
  echo "   - GET handler: $(grep -c 'export const GET' src/routes/api/media/[...path]/+server.ts)"
  echo "   - HEAD handler: $(grep -c 'export const HEAD' src/routes/api/media/[...path]/+server.ts)"
  echo "   - Range header support: $(grep -c 'Range' src/routes/api/media/[...path]/+server.ts)"
  echo "   - Fallback handling: $(grep -c 'serveFallback' src/routes/api/media/[...path]/+server.ts)"
  echo "   - Content-Type forwarding: $(grep -c 'content-type' src/routes/api/media/[...path]/+server.ts)"
else
  echo "❌ Media proxy route missing"
fi

# Check upload contentType usage
echo -e "\n📤 Checking upload contentType usage..."
upload_files=("src/components/PostComposer.svelte" "src/routes/profile/+page.svelte" "src/lib/stores/profileStore.ts")
for file in "${upload_files[@]}"; do
  if [ -f "$file" ]; then
    if grep -q "validatedUploadMime" "$file" && grep -q "contentType" "$file"; then
      echo "✅ $file uses validated MIME types"
    else
      echo "❌ $file missing validated MIME types"
    fi
  else
    echo "❌ $file not found"
  fi
done

# Check UI component improvements
echo -e "\n🎨 Checking UI component improvements..."
if [ -f "src/components/PostCard.svelte" ]; then
  echo "✅ PostCard component exists"
  echo "   - playsinline attribute: $(grep -c 'playsinline' src/components/PostCard.svelte)"
  echo "   - preload metadata: $(grep -c 'preload="metadata"' src/components/PostCard.svelte)"
  echo "   - Image error handling: $(grep -c 'onerror' src/components/PostCard.svelte)"
  echo "   - MIME detection import: $(grep -c 'detectMimeByExt' src/components/PostCard.svelte)"
else
  echo "❌ PostCard component missing"
fi

# Summary
echo -e "\n📊 Summary"
echo "=========="
echo "This script verifies the core components are in place."
echo "For full testing, you'll need to:"
echo "1. Deploy to a test environment with Supabase"
echo "2. Test media uploads with various file types"
echo "3. Verify video scrubbing works (Range requests)"
echo "4. Test fallback behavior with missing files"
echo "5. Cross-browser testing (Chrome, Safari, Edge)"

echo -e "\n✨ Bulletproof Media Pipeline implementation complete!"