'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface DcNumber {
  dcNumber: string;
  partCodes: string[];
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [dcNumbers, setDcNumbers] = useState<DcNumber[]>([]);
  const [selectedDcNumber, setSelectedDcNumber] = useState('');
  const router = useRouter();
  const { signIn, user, loading: authLoading, getSelectedDcNumber } = useAuth();

  // Load DC numbers on component mount
  useEffect(() => {
    loadDcNumbers();
  }, []);

  // Check if user is already logged in on initial load
  useEffect(() => {
    if (!authLoading && user && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [authLoading, user, isRedirecting, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate that DC Number is selected
    if (!selectedDcNumber) {
      setError('Please select DC Number');
      setLoading(false);
      return;
    }

    // First: authenticate user
    const result = await signIn(email, password);

    if (result.success) {
      try {
        // Store DC Number in localStorage/session
        console.log('=== LOGIN SUCCESS - STORING SESSION DATA ===');
        console.log('Value to store - DC Number:', selectedDcNumber);

        localStorage.setItem('selectedDcNumber', selectedDcNumber);
        // Clear any old partcode session data if it exists
        localStorage.removeItem('selectedPartCode');

        // Verify immediate storage
        const storedDc = localStorage.getItem('selectedDcNumber');
        console.log('=== STORAGE VERIFICATION ===');
        console.log('Immediately stored - DC Number:', storedDc);

        // Redirect to dashboard
        setIsRedirecting(true);
        setTimeout(() => {
          console.log('=== REDIRECTING TO DASHBOARD ===');
          router.push('/dashboard');
        }, 1000); // Increased delay to ensure data persistence
      } catch (error) {
        setError('Failed to store session data');
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const loadDcNumbers = async () => {
    try {
      console.log('Loading DC numbers...');
      const response = await fetch('/api/dc-numbers');
      if (response.ok) {
        const data = await response.json();
        setDcNumbers(data.dcNumbers || []);
      }
    } catch (error) {
      console.error('Error loading DC numbers:', error);
    }
  };

  // Show loading if checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't show login form if already logged in and not redirecting
  if (user && !isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">You are already logged in. Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {/* DC Number selection */}
          <div className="space-y-4 pt-4">
            <div>
              <label htmlFor="dc-number" className="block text-sm font-medium text-gray-700 mb-1">
                DC Number *
              </label>
              <select
                id="dc-number"
                value={selectedDcNumber}
                onChange={(e) => setSelectedDcNumber(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select DC Number</option>
                {dcNumbers.map((dc) => (
                  <option key={dc.dcNumber} value={dc.dcNumber}>
                    {dc.dcNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Don't have an account? Sign up
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <div className="text-center text-sm text-gray-600 mt-4">
            Your DC Number and Partcode selection will be locked for this session
          </div>
        </form>
      </div>
    </div>
  );
}