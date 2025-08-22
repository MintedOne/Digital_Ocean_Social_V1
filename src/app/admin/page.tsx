'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPanel from '@/components/auth/AdminPanel';
import { getUserDisplayName, getUserFirstName } from '@/lib/auth/user-display-utils';

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check if user is authenticated and has admin privileges
      const authResponse = await fetch('/api/auth/status');
      const authData = await authResponse.json();
      
      if (!authData.authenticated) {
        router.push('/login');
        return;
      }
      
      setUserInfo(authData.user);
      
      // Check admin privileges
      const adminResponse = await fetch('/api/admin/check');
      const adminData = await adminResponse.json();
      
      if (adminData.success && adminData.isAdmin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You do not have administrator privileges to access this page.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Return to Home
            </button>
            <button
              onClick={() => router.push('/auth-status')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Check Auth Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-purple-800 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {userInfo?.firstName || userInfo?.lastName 
                  ? `Welcome, ${getUserFirstName(userInfo)}!`
                  : 'Admin Portal'
                }
              </h1>
              <p className="text-blue-200 mt-2">
                {userInfo?.firstName && userInfo?.lastName 
                  ? 'User Management & System Administration'
                  : 'User Management & System Administration'
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {getUserDisplayName(userInfo)}
                    </p>
                    <p className="text-xs text-blue-200">{userInfo?.email || 'admin@mintedyachts.com'}</p>
                  </div>
                </div>
              </div>
              
              {/* Back to Portal Button */}
              <button
                onClick={() => router.push('/')}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-white/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Portal
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <AdminPanel />
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-blue-200">
            © 2025 Minted Yachts Admin Portal. Secure user management system.
          </p>
        </div>
      </footer>
    </div>
  );
}