import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import AuthService, { OAuthProvider } from '../services/AuthService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signUp: (email: string, password: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<{ error?: Error }>;
  resetPassword: (email: string) => Promise<{ error?: Error }>;
  updatePassword: (password: string) => Promise<{ error?: Error }>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error?: Error }>;
  updateProfile: (data: { email?: string; username?: string; data?: Record<string, any> }) => Promise<{ error?: Error }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Get current session
        const currentSession = await AuthService.getCurrentSession();
        setSession(currentSession);
        
        // Get current user if there's a session
        if (currentSession) {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: authListener } = AuthService.onAuthStateChange(
      (event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession);
        
        // Handle different auth states
        switch (event) {
          case 'SIGNED_IN':
            // Update the user when signed in
            AuthService.getCurrentUser().then(setUser);
            break;
          case 'SIGNED_OUT':
            // Clear the user when signed out
            setUser(null);
            break;
          case 'USER_UPDATED':
            // Update the user when their data changes
            AuthService.getCurrentUser().then(setUser);
            break;
          default:
            break;
        }
      }
    );

    // Cleanup subscription
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    const { error } = await AuthService.signIn(email, password);
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await AuthService.signUp(email, password);
    return { error };
  };

  const signInWithOAuth = async (provider: OAuthProvider) => {
    const { error } = await AuthService.signInWithOAuth(provider);
    return { error };
  };

  const signOut = async () => {
    const { error } = await AuthService.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await AuthService.resetPassword(email);
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await AuthService.updatePassword(password);
    return { error };
  };

  const updateProfile = async (data: { email?: string; username?: string; data?: Record<string, any> }) => {
    const { error } = await AuthService.updateProfile(data);
    return { error };
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    signInWithOAuth,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 