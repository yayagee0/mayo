import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Avatar Bucket Consistency Fix', () => {
  describe('ProfileStore Upload Consistency', () => {
    it('should use post-media bucket for avatar uploads in ProfileStore', () => {
      const profileStorePath = join(process.cwd(), 'src/lib/stores/profileStore.ts')
      const profileStoreContent = readFileSync(profileStorePath, 'utf-8')
      
      // Verify ProfileStore uses post-media bucket for uploads
      expect(profileStoreContent).toContain(".from('post-media')")
      
      // Should not use avatars bucket for uploads
      expect(profileStoreContent).not.toContain(".from('avatars')")
    })

    it('should use consistent path format for avatars', () => {
      const profileStorePath = join(process.cwd(), 'src/lib/stores/profileStore.ts')
      const profileStoreContent = readFileSync(profileStorePath, 'utf-8')
      
      // Verify consistent path format: avatars/${userId}-avatar.${ext}
      expect(profileStoreContent).toContain('avatars/${userId}-avatar.${ext}')
    })

    it('should use post-media bucket for signed URL generation', () => {
      const profileStorePath = join(process.cwd(), 'src/lib/stores/profileStore.ts')
      const profileStoreContent = readFileSync(profileStorePath, 'utf-8')
      
      // Verify resolveAvatar function uses post-media bucket for createSignedUrl
      expect(profileStoreContent).toContain(".from('post-media')")
      expect(profileStoreContent).toContain("createSignedUrl(avatarPath, 3600)")
    })

    it('should use proxy URLs instead of signed URLs for avatars', () => {
      const profileStorePath = join(process.cwd(), 'src/lib/stores/profileStore.ts')
      const profileStoreContent = readFileSync(profileStorePath, 'utf-8')
      
      // Should use proxy URL approach instead of creating signed URLs
      expect(profileStoreContent).toContain('resolveAvatar')
      expect(profileStoreContent).toContain('/api/media/post-media/')
      expect(profileStoreContent).not.toContain('createSignedUrl')
    })
  })

  describe('Profile Page Upload Consistency', () => {
    it('should use post-media bucket for profile page uploads', () => {
      const profilePagePath = join(process.cwd(), 'src/routes/profile/+page.svelte')
      const profilePageContent = readFileSync(profilePagePath, 'utf-8')
      
      // Verify profile page uploads to post-media bucket
      expect(profilePageContent).toContain("supabase.storage.from('post-media')")
      
      // Should use consistent avatar path format
      expect(profilePageContent).toContain('avatars/${$user?.id}-avatar.png')
    })
  })
})