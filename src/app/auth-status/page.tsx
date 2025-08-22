'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AuthStatus {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role: string;
  } | null;
}

export default function AuthStatusPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering dynamic content
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      checkAuthStatus();
    }
  }, [mounted]);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setAuthStatus(data);
    } catch (err) {
      setError('Failed to check authentication status');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        // Use router.push for client-side navigation
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout error:', err);
      // Fallback to window.location if router fails
      window.location.href = '/login';
    }
  };

  // Don't render dynamic content until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Authentication Status
            </h1>
            <p className="text-gray-600">
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {authStatus?.authenticated && authStatus.user?.firstName && authStatus.user?.lastName
              ? `Hello, ${authStatus.user.firstName}!`
              : 'Authentication Status'
            }
          </h1>
          <p className="text-gray-600">
            {authStatus?.authenticated && authStatus.user?.firstName
              ? 'Your current session and account information'
              : 'Current session and user information'
            }
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : authStatus ? (
            <div className="space-y-6">
              {/* Authentication Status */}
              <div className="flex items-center justify-between pb-6 border-b">
                <span className="text-lg font-medium text-gray-700">Status:</span>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  authStatus.authenticated 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {authStatus.authenticated ? '🟢 Authenticated' : '⚪ Not Authenticated'}
                </span>
              </div>

              {/* User Information */}
              {authStatus.authenticated && authStatus.user ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">User Information</h2>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">User ID:</span>
                      <span className="font-mono text-sm text-gray-900">{authStatus.user.id}</span>
                    </div>
                    
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Email:</span>
                      <span className="text-gray-900">{authStatus.user.email}</span>
                    </div>
                    
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Name:</span>
                      <span className="text-gray-900">
                        {authStatus.user.firstName && authStatus.user.lastName 
                          ? `${authStatus.user.firstName} ${authStatus.user.lastName}`
                          : authStatus.user.displayName
                        }
                      </span>
                    </div>
                    
                    {authStatus.user.firstName && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">First Name:</span>
                        <span className="text-gray-900">{authStatus.user.firstName}</span>
                      </div>
                    )}
                    
                    {authStatus.user.lastName && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Last Name:</span>
                        <span className="text-gray-900">{authStatus.user.lastName}</span>
                      </div>
                    )}
                    
                    {authStatus.user.phoneNumber && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Phone:</span>
                        <span className="text-gray-900">{authStatus.user.phoneNumber}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Role:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        authStatus.user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {authStatus.user.role}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">You are not currently logged in</p>
                  <Link 
                    href="/login"
                    className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Go to Login
                  </Link>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={checkAuthStatus}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🔄 Refresh Status
          </button>
          
          {authStatus?.authenticated && (
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              🚪 Logout
            </button>
          )}
          
          <Link 
            href="/"
            className="px-6 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            🏠 Back to Home
          </Link>
        </div>

        {/* Debug Info - Only show when mounted and data is loaded */}
        {authStatus && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Raw JSON Response:</h3>
            <pre className="text-xs text-gray-700 overflow-x-auto">
              {JSON.stringify(authStatus, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}