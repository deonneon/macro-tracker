import { supabase } from '../lib/supabase';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// Define auth response types
export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error?: Error;
}

// OAuth provider types
export type OAuthProvider = 'google' | 'github' | 'facebook' | 'twitter';

// AuthService to manage authentication functions
const AuthService = {
  /**
   * Get the current logged-in user
   */
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Get the current session
   */
  getCurrentSession: async (): Promise<Session | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    return {
      user: data?.user || null,
      session: data?.session || null,
      error: error || undefined,
    };
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data?.user || null,
      session: data?.session || null,
      error: error || undefined,
    };
  },

  /**
   * Sign in with OAuth provider
   */
  signInWithOAuth: async (provider: OAuthProvider): Promise<{ error?: Error }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    return { error: error || undefined };
  },

  /**
   * Sign out the current user
   */
  signOut: async (): Promise<{ error?: Error }> => {
    const { error } = await supabase.auth.signOut();
    return { error: error || undefined };
  },

  /**
   * Send password reset email
   */
  resetPassword: async (email: string): Promise<{ error?: Error }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error || undefined };
  },

  /**
   * Update user password
   */
  updatePassword: async (password: string): Promise<{ error?: Error }> => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error || undefined };
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: { 
    email?: string;
    username?: string;
    data?: Record<string, any>;
  }): Promise<{ error?: Error }> => {
    const { error } = await supabase.auth.updateUser(data);
    return { error: error || undefined };
  },

  /**
   * Set up auth state change listener
   */
  onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};

export default AuthService; 