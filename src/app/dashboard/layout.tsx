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
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_access_token') || ''}`,
          },
        });

        if (res.status === 401) {
          // Not authenticated, redirect to login
          router.push('/login');
          router.refresh();
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        router.push('/login');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [router]);

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