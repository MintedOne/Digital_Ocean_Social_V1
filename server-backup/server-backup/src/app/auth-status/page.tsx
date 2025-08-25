'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUserDisplayName, getUserFirstName } from '@/lib/auth/user-display-utils';

interface UserAddress {
  streetAddress?: string;
  city?: string;
  stateProvince?: string;
  zipPostalCode?: string;
  country?: string;
}

interface AuthStatus {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: UserAddress;
    role: string;
  } | null;
}

export default function AuthStatusPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: {
      streetAddress: '',
      city: '',
      stateProvince: '',
      zipPostalCode: '',
      country: ''
    }
  });

  // Ensure component is mounted before rendering dynamic content
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      checkAuthStatus();
    }
  }, [mounted]);

  // Update profile data when user data changes
  useEffect(() => {
    if (authStatus?.user) {
      setProfileData({
        firstName: authStatus.user.firstName || '',
        lastName: authStatus.user.lastName || '',
        phoneNumber: authStatus.user.phoneNumber || '',
        address: {
          streetAddress: authStatus.user.address?.streetAddress || '',
          city: authStatus.user.address?.city || '',
          stateProvince: authStatus.user.address?.stateProvince || '',
          zipPostalCode: authStatus.user.address?.zipPostalCode || '',
          country: authStatus.user.address?.country || ''
        }
      });
    }
  }, [authStatus?.user]);

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

  const handleEditProfile = () => {
    setIsEditing(true);
    setProfileError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileError('');
    // Reset form data to current user data
    if (authStatus?.user) {
      setProfileData({
        firstName: authStatus.user.firstName || '',
        lastName: authStatus.user.lastName || '',
        phoneNumber: authStatus.user.phoneNumber || '',
        address: {
          streetAddress: authStatus.user.address?.streetAddress || '',
          city: authStatus.user.address?.city || '',
          stateProvince: authStatus.user.address?.stateProvince || '',
          zipPostalCode: authStatus.user.address?.zipPostalCode || '',
          country: authStatus.user.address?.country || ''
        }
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError('');

      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local auth status with new user data
        setAuthStatus(prev => prev ? {
          ...prev,
          user: data.user
        } : null);
        setIsEditing(false);
        setProfileError('');
      } else {
        setProfileError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError('Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setProfileData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
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
            {authStatus?.authenticated && authStatus.user
              ? `Hello, ${getUserFirstName(authStatus.user)}!`
              : 'Authentication Status'
            }
          </h1>
          <p className="text-gray-600">
            {authStatus?.authenticated && authStatus.user
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
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">User Information</h2>
                    {!isEditing && (
                      <button
                        onClick={handleEditProfile}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        ✏️ Edit Profile
                      </button>
                    )}
                  </div>

                  {profileError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                      {profileError}
                    </div>
                  )}
                  
                  {!isEditing ? (
                    // Display mode
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
                          {getUserDisplayName(authStatus.user)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">First Name:</span>
                        <span className="text-gray-900">{authStatus.user.firstName || 'Not provided'}</span>
                      </div>
                      
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Last Name:</span>
                        <span className="text-gray-900">{authStatus.user.lastName || 'Not provided'}</span>
                      </div>
                      
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Phone:</span>
                        <span className="text-gray-900">{authStatus.user.phoneNumber || 'Not provided'}</span>
                      </div>

                      {/* Address Section */}
                      <div className="border-t pt-4 mt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Address</h3>
                        
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Street Address:</span>
                          <span className="text-gray-900">{authStatus.user.address?.streetAddress || 'Not provided'}</span>
                        </div>
                        
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">City:</span>
                          <span className="text-gray-900">{authStatus.user.address?.city || 'Not provided'}</span>
                        </div>
                        
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">State/Province:</span>
                          <span className="text-gray-900">{authStatus.user.address?.stateProvince || 'Not provided'}</span>
                        </div>
                        
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">ZIP/Postal Code:</span>
                          <span className="text-gray-900">{authStatus.user.address?.zipPostalCode || 'Not provided'}</span>
                        </div>
                        
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Country:</span>
                          <span className="text-gray-900">{authStatus.user.address?.country || 'Not provided'}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between py-2 border-t pt-4 mt-4">
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
                  ) : (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            placeholder="Enter your first name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            placeholder="Enter your last name"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profileData.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          placeholder="Enter your phone number"
                        />
                      </div>

                      {/* Address Fields */}
                      <div className="border-t pt-4 mt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Address</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Street Address
                            </label>
                            <input
                              type="text"
                              value={profileData.address.streetAddress}
                              onChange={(e) => handleInputChange('address.streetAddress', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                              placeholder="Enter your street address"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={profileData.address.city}
                                onChange={(e) => handleInputChange('address.city', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                placeholder="Enter your city"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                State/Province
                              </label>
                              <input
                                type="text"
                                value={profileData.address.stateProvince}
                                onChange={(e) => handleInputChange('address.stateProvince', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                placeholder="Enter your state or province"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                ZIP/Postal Code
                              </label>
                              <input
                                type="text"
                                value={profileData.address.zipPostalCode}
                                onChange={(e) => handleInputChange('address.zipPostalCode', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                placeholder="Enter your ZIP or postal code"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country
                              </label>
                              <input
                                type="text"
                                value={profileData.address.country}
                                onChange={(e) => handleInputChange('address.country', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                placeholder="Enter your country"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Edit Actions */}
                      <div className="flex gap-3 pt-4 border-t mt-6">
                        <button
                          onClick={handleSaveProfile}
                          disabled={profileLoading}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {profileLoading ? '💾 Saving...' : '💾 Save Changes'}
                        </button>
                        
                        <button
                          onClick={handleCancelEdit}
                          disabled={profileLoading}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  )}
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