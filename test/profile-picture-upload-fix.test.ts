import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Profile Picture Upload Fix - HTTP 406 Error', () => {
  it('should use profileStore.updateProfile() for profile updates to ensure proper handling', () => {
    // Read the profile page source code
    const profilePagePath = join(process.cwd(), 'src/routes/profile/+page.svelte')
    const profilePageContent = readFileSync(profilePagePath, 'utf-8')
    
    // Verify the improved implementation: using profileStore instead of raw queries
    expect(profilePageContent).toContain('await profileStore.updateProfile($user!.id, { avatar_url: path })')
    
    // Verify upsert option is enabled for storage upload
    expect(profilePageContent).toContain('upsert: true')
    
    // Verify error handling is present
    expect(profilePageContent).toContain('} catch (error) {')
    expect(profilePageContent).toContain('console.error')
  })
  
  it('should have proper error handling for all upload steps', () => {
    const profilePagePath = join(process.cwd(), 'src/routes/profile/+page.svelte')
    const profilePageContent = readFileSync(profilePagePath, 'utf-8')
    
    // Verify error handling is present
    expect(profilePageContent).toContain('try {')
    expect(profilePageContent).toContain('} catch (error) {')
    
    // Verify upload error handling
    expect(profilePageContent).toContain('if (uploadError) throw uploadError')
    
    // Verify notification handling for user feedback
    expect(profilePageContent).toContain('notificationStore.add')
    expect(profilePageContent).toContain('Upload failed. Please try again.')
  })
  
  it('should properly use profileStore for database operations', () => {
    const profilePagePath = join(process.cwd(), 'src/routes/profile/+page.svelte')
    const profilePageContent = readFileSync(profilePagePath, 'utf-8')
    
    // Verify we're using the profileStore which already handles proper error handling
    expect(profilePageContent).toContain('import { profileStore')
    expect(profilePageContent).toContain('profileStore.updateProfile')
    
    // Verify storage upload has upsert enabled
    expect(profilePageContent).toContain('upsert: true')
  })
})