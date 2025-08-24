// ✅ New: Avatar upload with universal file handling
async uploadAvatar(userId: string, file: File): Promise<string | null> {
  try {
    let processedFile: File = file;

    // 1. Convert HEIC → JPEG if needed
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      const blob = await heic2any({ blob: file, toType: 'image/jpeg' });
      processedFile = new File([blob as BlobPart], `${userId}.jpg`, { type: 'image/jpeg' });
    }

    // 2. Always compress + resize (max 512x512)
    const imageCompression = (await import('browser-image-compression')).default;
    const compressedBlob = await imageCompression(processedFile, {
      maxSizeMB: 0.3,        // ~300KB
      maxWidthOrHeight: 512, // resize
      useWebWorker: true
    });
    processedFile = new File([compressedBlob], `${userId}.jpg`, { type: 'image/jpeg' });

    // 3. Always overwrite the same path (auto replace old avatar)
    const filePath = `avatars/${userId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, processedFile, { upsert: true });

    if (uploadError) throw uploadError;

    // 4. Get long-lived signed URL
    const { data: signed } = await supabase.storage
      .from('avatars')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

    if (signed?.signedUrl) {
      await this.updateProfile(userId, { avatar_url: signed.signedUrl });
      return signed.signedUrl;
    }

    return null;
  } catch (err) {
    console.error('Error uploading avatar:', err);
    return null;
  }
}
