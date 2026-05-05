import { createClient } from '@supabase/supabase-js'

// These are public anon keys - safe to expose in frontend
// Users need to create their own Supabase project and update these
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      submissions: {
        Row: {
          id: string
          user_id: string
          username: string
          song_name: string
          composer: string
          charter: string
          difficulty: string
          difficulty_level: number
          track_type: 'regular' | 'entertainment'
          mode: 'solo' | 'collab'
          partner_username: string | null
          partner_user_id: string | null
          file_path: string
          file_name: string
          file_size: number
          notes: string | null
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['submissions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['submissions']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
    }
  }
}

