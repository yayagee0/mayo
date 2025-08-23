import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Specific data types for structured JSON data  
export interface AyahData {
  arabic: string
  translation: string
  reference: string
}

export interface PollData {
  type: 'options' | 'feedback'
  options?: string[]
  mood?: string
  feedback?: string
  role?: string
}

export interface Database {
  public: {
    Tables: {
      interactions: {
        Row: {
          answer_index: number | null
          created_at: string | null
          item_id: string
          type: 'like' | 'love' | 'vote' | 'bookmark' | 'seen' | 'thanks'
          user_email: string
        }
        Insert: {
          answer_index?: number | null
          created_at?: string | null
          item_id: string
          type: 'like' | 'love' | 'vote' | 'bookmark' | 'seen' | 'thanks'
          user_email: string
        }
        Update: {
          answer_index?: number | null
          created_at?: string | null
          item_id?: string
          type?: 'like' | 'love' | 'vote' | 'bookmark' | 'seen' | 'thanks'
          user_email?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          author_email: string
          author_id: string | null
          body: string | null
          created_at: string | null
          data: Json | null
          end_at: string | null
          id: string
          is_deleted: boolean | null
          kind: 'post' | 'comment' | 'event' | 'ayah' | 'poll' | 'tip' | 'system'
          media_urls: string[] | null
          parent_id: string | null
          start_at: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          author_email: string
          author_id?: string | null
          body?: string | null
          created_at?: string | null
          data?: Json | null
          end_at?: string | null
          id?: string
          is_deleted?: boolean | null
          kind: 'post' | 'comment' | 'event' | 'ayah' | 'poll' | 'tip' | 'system'
          media_urls?: string[] | null
          parent_id?: string | null
          start_at?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          author_email?: string
          author_id?: string | null
          body?: string | null
          created_at?: string | null
          data?: Json | null
          end_at?: string | null
          id?: string
          is_deleted?: boolean | null
          kind?: 'post' | 'comment' | 'event' | 'ayah' | 'poll' | 'tip' | 'system'
          media_urls?: string[] | null
          parent_id?: string | null
          start_at?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          dob: string | null
          email: string
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          dob?: string | null
          email: string
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          dob?: string | null
          email?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)