import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gtuzqsdikvncaetifepc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dXpxc2Rpa3ZuY2FldGlmZXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNzk4MDAsImV4cCI6MjA4MTc1NTgwMH0.vzwmRxkc3SElrDasAU7Lgr9WN-2fTXHzDhNtUEwznc4';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      timeline_entries: {
        Row: {
          id: string;
          date: string;
          title: string;
          description: string;
          photo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          title: string;
          description: string;
          photo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          title?: string;
          description?: string;
          photo?: string | null;
          created_at?: string;
        };
      };
      letters: {
        Row: {
          id: string;
          title: string;
          content: string;
          is_opened: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          is_opened?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          is_opened?: boolean;
          created_at?: string;
        };
      };
      flowers: {
        Row: {
          id: string;
          message: string;
          is_bloomed: boolean;
          type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message: string;
          is_bloomed?: boolean;
          type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message?: string;
          is_bloomed?: boolean;
          type?: string;
          created_at?: string;
        };
      };
      app_settings: {
        Row: {
          id: string;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          password_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          password_hash?: string;
          created_at?: string;
        };
      };
    };
  };
}
