'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  supabase_user_id: string;
  email: string;
  role: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in when app loads
    const checkSession = async () => {
      // Add a small delay to avoid race conditions during initial page load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const token = localStorage.getItem('supabase_access_token');
      
      // Only make the request if a token exists
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token invalid or expired, clear it
          localStorage.removeItem('supabase_access_token');
          localStorage.removeItem('supabase_refresh_token');
        }
      } catch (err) {
        console.error('Error checking session:', err);
        // Clear any potentially invalid tokens
        localStorage.removeItem('supabase_access_token');
        localStorage.removeItem('supabase_refresh_token');
      } finally {
        setLoading(false);
      }
    };

    // Only run the session check once on initial mount
    if (loading) {
      checkSession();
    }
  }, []); // Only run once on mount

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store tokens in localStorage (tokens are managed by Supabase client)
      
      // Update user state
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Store tokens in localStorage (tokens are managed by Supabase client)
      
      // Update user state
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      // Clear tokens from localStorage
      localStorage.removeItem('supabase_access_token');
      localStorage.removeItem('supabase_refresh_token');

      // Update user state
      setUser(null);
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}