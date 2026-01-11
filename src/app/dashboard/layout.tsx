'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Check authentication status using the shared AuthContext
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login');
      }
      setIsCheckingAuth(false);
    }
  }, [authLoading, user, router]);

  // Show loading while checking auth status
  if (isCheckingAuth || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null; // The redirect will happen in useEffect
  }

  return <>{children}</>;
}