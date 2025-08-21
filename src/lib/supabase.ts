import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          role: string | null
          dob: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          role?: string | null
          dob?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: string | null
          dob?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      items: {
        Row: {
          id: string
          kind: 'post' | 'comment' | 'event' | 'ayah' | 'poll' | 'tip' | 'system'
          author_id: string | null
          author_email: string
          visibility: string | null
          body: string | null
          media_urls: string[] | null
          parent_id: string | null
          start_at: string | null
          end_at: string | null
          data: any | null
          is_deleted: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          kind: 'post' | 'comment' | 'event' | 'ayah' | 'poll' | 'tip' | 'system'
          author_id?: string | null
          author_email: string
          visibility?: string | null
          body?: string | null
          media_urls?: string[] | null
          parent_id?: string | null
          start_at?: string | null
          end_at?: string | null
          data?: any | null
          is_deleted?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          kind?: 'post' | 'comment' | 'event' | 'ayah' | 'poll' | 'tip' | 'system'
          author_id?: string | null
          author_email?: string
          visibility?: string | null
          body?: string | null
          media_urls?: string[] | null
          parent_id?: string | null
          start_at?: string | null
          end_at?: string | null
          data?: any | null
          is_deleted?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      interactions: {
        Row: {
          item_id: string
          user_email: string
          type: 'like' | 'love' | 'vote' | 'bookmark' | 'seen' | 'thanks'
          answer_index: number | null
          created_at: string | null
        }
        Insert: {
          item_id: string
          user_email: string
          type: 'like' | 'love' | 'vote' | 'bookmark' | 'seen' | 'thanks'
          answer_index?: number | null
          created_at?: string | null
        }
        Update: {
          item_id?: string
          user_email?: string
          type?: 'like' | 'love' | 'vote' | 'bookmark' | 'seen' | 'thanks'
          answer_index?: number | null
          created_at?: string | null
        }
      }
    }
  }
}

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)