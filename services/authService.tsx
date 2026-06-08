import { Session, User } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { supabase } from './supabase';

export type UserRole = Database['public']['Enums']['user_role'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthSubscription = {
  unsubscribe: () => void;
};

export const authService = {
  getCurrentUser: async (): Promise<User | null> => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return session?.user ?? null;
  },

  getCurrentProfile: async (currentUser: User | null): Promise<Profile | null> => {
    if (!currentUser) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  onAuthStateChange: (callback: (session: Session | null) => void): AuthSubscription => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => callback(session));

    return subscription;
  },

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
  },

  signUp: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
    role: UserRole
  ) => {
    const {
      data: { user },
      error: signUpError,
    } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      throw signUpError;
    }

    if (!user?.id) {
      throw new Error('Impossible de créer l’utilisateur.');
    }
    // Wait a moment for the user to be available in the database
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    const profileData = {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      phone,
      role,
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Database['public']['Tables']['profiles']['Insert'];

    const { error: profileError } = existingProfile
      ? await (supabase.from('profiles') as any).update({
          first_name: firstName,
          last_name: lastName,
          phone,
          role,
          is_active: true,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id)
      : await (supabase.from('profiles') as any).insert(profileData);

    if (profileError) {
      throw profileError;
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },
};