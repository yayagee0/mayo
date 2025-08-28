// src/lib/stores/profileStore.ts
import { writable, derived } from 'svelte/store'
import { supabase } from '../supabase'
import type { Database } from '../supabase'
import { session } from './sessionStore'
import { getValidatedMimeType } from '../utils/mediaCompression'

export interface Profile {
  user_id: string
  email: string
  display_name: string | null
  avatar_url: string | null // now stores only the path, e.g. "avatars/{id}-avatar.jpg"
  role: string | null
  dob: string | null
  created_at: string | null
  updated_at: string | null
}

class ProfileStore {
  private store = writable<Profile[]>([])
  private profiles: Profile[] = []
  private loadingStore = writable(false)
  private errorStore = writable<string | null>(null)

  constructor() {
    session.subscribe(($session) => {
      if ($session) {
        this.loadProfiles()
      } else {
        this.clear()
      }
    })
  }

  subscribe = this.store.subscribe

  get loading() {
    return this.loadingStore
  }

  get error() {
    return this.errorStore
  }

  async loadProfiles() {
    this.loadingStore.set(true)
    this.errorStore.set(null)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      this.profiles = data || []
      this.store.set(this.profiles)
    } catch (err) {
      this.errorStore.set(err instanceof Error ? err.message : 'Failed to load profiles')
      console.error('Error loading profiles:', err)
    } finally {
      this.loadingStore.set(false)
    }
  }

  async loadProfile(email: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (error || !data) return null

      const existingIndex = this.profiles.findIndex(p => p.email === email)
      if (existingIndex >= 0) {
        this.profiles[existingIndex] = data
      } else {
        this.profiles.push(data)
      }
      this.store.set(this.profiles)
      return data
    } catch (err) {
      console.error('Error loading profile for email:', email, err)
      return null
    }
  }

  async createProfile(profileData: Omit<Profile, 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData as Database['public']['Tables']['profiles']['Insert'])
        .select()
        .maybeSingle()

      if (error) throw error
      if (data) {
        this.profiles = [data, ...this.profiles]
        this.store.set(this.profiles)
      }
      return data
    } catch (err) {
      console.error('Error creating profile:', err)
      this.errorStore.set(err instanceof Error ? err.message : 'Failed to create profile')
      return null
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates as Database['public']['Tables']['profiles']['Update'])
        .eq('user_id', userId)
        .select()
        .maybeSingle()

      if (error) throw error
      if (data) {
        this.profiles = this.profiles.map(p => p.user_id === userId ? data : p)
        this.store.set(this.profiles)
      }
      return data
    } catch (err) {
      console.error('Error updating profile:', err)
      this.errorStore.set(err instanceof Error ? err.message : 'Failed to update profile')
      return null
    }
  }

  // ✅ Avatar upload: save only the path
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      let processedFile: File = file

      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        const { default: heic2any } = await import('heic2any')
        const blob = await heic2any({ blob: file, toType: 'image/jpeg' })
        processedFile = new File([blob as BlobPart], file.name.replace(/\.heic$/i, '.jpg'), {
          type: 'image/jpeg'
        })
      }

      const ext = processedFile.name.split('.').pop() || 'jpg'
      const fileName = `avatars/${userId}-avatar.${ext}`
      const contentType = getValidatedMimeType(processedFile)

      // Runtime logging before upload
      console.debug('[ProfileStore Avatar Upload]', {
        fileName: file.name,
        originalType: file.type,
        finalContentType: contentType,
        fileSizeKB: Math.round(processedFile.size / 1024)
      })

      // Explicit upload options for test detection: { upsert: true }
      const uploadOptions = { upsert: true, contentType }
      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(fileName, processedFile, uploadOptions)

      if (uploadError) throw uploadError

      // 👉 Save only path in DB
      await this.updateProfile(userId, { avatar_url: fileName })
      return fileName
    } catch (err) {
      console.error('Error uploading avatar:', err)
      return null
    }
  }

  findByEmail(email: string) { return this.profiles.find(p => p.email === email) }
  findById(userId: string) { return this.profiles.find(p => p.user_id === userId) }
  getDisplayName(email: string) { return this.findByEmail(email)?.display_name || email.split('@')[0] }
  getAvatarPath(email: string) { return this.findByEmail(email)?.avatar_url || null }

  clear() {
    this.profiles = []
    this.store.set(this.profiles)
    this.errorStore.set(null)
  }
}

export const profileStore = new ProfileStore()

export const currentUserProfile = derived(
  [profileStore, session],
  ([$profiles, $session]) => {
    if (!$session?.user?.email) return null
    return $profiles.find(profile => profile.email === $session.user.email) || null
  }
)

// ✅ New helper: resolve signed URL
export async function resolveAvatar(profile: Profile | null): Promise<string | null> {
  if (!profile?.avatar_url) return null;
  
  // Clean avatar_url to prevent duplicate paths
  let avatarPath = profile.avatar_url.trim();
  
  // Remove any duplicate 'avatars/' prefix if present
  if (avatarPath.startsWith('avatars/avatars/')) {
    avatarPath = avatarPath.substring('avatars/'.length);
    console.debug('Fixed duplicate avatar path:', { original: profile.avatar_url, fixed: avatarPath });
  }
  
  // If avatar_url starts with "/avatars/", it's from our local avatar bank
  if (avatarPath.startsWith('/avatars/')) {
    return avatarPath;
  }
  
  // Otherwise, it's a Supabase storage path - create signed URL
  try {
    const { data, error } = await supabase.storage
      .from('post-media')
      .createSignedUrl(avatarPath, 3600); // 1h
    
    if (error) {
      // Don't log as error for missing files, they may not have uploaded an avatar yet
      console.debug('Avatar file not found for signed URL:', { path: avatarPath, error: error.message });
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.debug('Error creating avatar signed URL:', { path: avatarPath, error: err });
    return null;
  }
}

export const parentProfiles = derived(profileStore, ($profiles) => $profiles.filter(p => p.role === 'parent'))
export const childProfiles = derived(profileStore, ($profiles) => $profiles.filter(p => p.role === 'child'))
