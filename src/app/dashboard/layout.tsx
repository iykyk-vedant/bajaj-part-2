'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // Add small delay to avoid race conditions with AuthContext initialization
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if token exists first
      const token = localStorage.getItem('supabase_access_token');
      
      // If no token, user is definitely not authenticated
      if (!token) {
        router.push('/login');
        setIsAuthenticated(false);
        return;
      }
      
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          // Not authenticated, redirect to login
          localStorage.removeItem('supabase_access_token');
          localStorage.removeItem('supabase_refresh_token');
          router.push('/login');
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        localStorage.removeItem('supabase_access_token');
        localStorage.removeItem('supabase_refresh_token');
        router.push('/login');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []); // Only run once on mount

  if (isAuthenticated === null) {
    // Loading state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    // Don't render children if not authenticated
    return null;
  }

  return <>{children}</>;
}