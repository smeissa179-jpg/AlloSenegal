import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, Profile, UserRole } from '../services/authService';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  role: UserRole | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    try {
      const userProfile = await authService.getCurrentProfile(currentUser);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching profile in AuthProvider:', error);
    }
  };

  useEffect(() => {
    // 1. Check current session on mount
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        await fetchProfile(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for auth changes
    const subscription = authService.onAuthStateChange(async (session: Session | null) => {
      setIsLoading(true);
      const currentUser = session?.user || null;
      setUser(currentUser);
      await fetchProfile(currentUser);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('SignOut error in AuthProvider:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        role: profile?.role || null,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
