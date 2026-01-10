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
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_access_token') || ''}`,
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

    checkSession();
  }, []);

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

      // Store tokens in localStorage
      if (data.session?.access_token) {
        localStorage.setItem('supabase_access_token', data.session.access_token);
      }
      if (data.session?.refresh_token) {
        localStorage.setItem('supabase_refresh_token', data.session.refresh_token);
      }

      // Update user state
      setUser(data.user || data.session?.user);
      
      return { success: true, user: data.user || data.session?.user };
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

      // Store tokens in localStorage
      if (data.session?.access_token) {
        localStorage.setItem('supabase_access_token', data.session.access_token);
      }
      if (data.session?.refresh_token) {
        localStorage.setItem('supabase_refresh_token', data.session.refresh_token);
      }

      // Update user state
      setUser(data.user || data.session?.user);
      
      return { success: true, user: data.user || data.session?.user };
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
      router.refresh();
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