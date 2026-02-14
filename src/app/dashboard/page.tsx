'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useSessionData } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { dcNumber, partCode } = useSessionData();

  useEffect(() => {
    // Redirect to home page which contains the main application
    if (!loading && user) {
      router.push('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If not authenticated, the AuthContext will handle redirecting to login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Session Information</h2>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">DC Number:</span>
                  <span className="ml-2 text-gray-900">{dcNumber || 'Not selected'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">User:</span>
                  <span className="ml-2 text-gray-900">{user.name || user.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Role:</span>
                  <span className="ml-2 text-gray-900">{user.role}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">Navigation</h2>
              <div className="space-y-3">
                <Link
                  href="/"
                  className="block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-center"
                >
                  Main Application
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes</h2>
            <ul className="list-disc list-inside text-yellow-700 space-y-1">
              <li>Your DC Number is locked for this session</li>
              <li>You can only access data related to your selected DC</li>
              <li>To change your DC Number, please sign out and log in again</li>
              <li>Partcode can be selected and changed within each tab</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
