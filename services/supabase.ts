import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Database } from '../types/database';

// Configuration parameters - prioritizing Expo public environment variables
// Falls back to your project credentials securely
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://acgvuiqtqfxkiwiyhmtn.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZ3Z1aXF0cWZ4a2l3aXlobXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjYwNzEsImV4cCI6MjA5NTMwMjA3MX0.XK-JIwvMlmLQJh34rkNNnX0-SuDckys6NChEOA2w29o';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. Please define EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient<Database, 'public'>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Required for React Native to prevent routing issues
  },
});
