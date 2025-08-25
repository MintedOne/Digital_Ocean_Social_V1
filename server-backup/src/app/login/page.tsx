'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import RegistrationForm from '@/components/auth/RegistrationForm';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (email: string, displayName: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, displayName, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to home page
        router.push('/');
        router.refresh();
      } else {
        const error = new Error(data.error || 'Login failed') as any;
        error.requiresApproval = data.requiresApproval;
        error.requiresPassword = data.requiresPassword;
        throw error;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleRegistration = async (email: string, firstName?: string, lastName?: string, phoneNumber?: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, firstName, lastName, phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setRegistrationSuccess(data.message);
        setError('');
        // Switch back to login form after successful registration
        setTimeout(() => {
          setShowRegistration(false);
          setRegistrationSuccess('');
        }, 5000);
      } else {
        const error = new Error(data.error || 'Registration failed');
        throw error;
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Minted Yachts
          </h1>
          <p className="text-gray-600">
            Social Media Management System
          </p>
        </div>

        {/* Login/Registration Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {registrationSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Account Request Submitted!</p>
                  <p className="mt-1">{registrationSuccess}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {showRegistration ? 'Request Access' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {showRegistration 
                ? 'Create a new account to access the dashboard'
                : 'Sign in to access your dashboard'
              }
            </p>
          </div>

          {showRegistration ? (
            <RegistrationForm 
              onSubmit={handleRegistration}
              onBackToLogin={() => setShowRegistration(false)} 
            />
          ) : (
            <>
              <LoginForm onSubmit={handleLogin} />
              
              {/* New User Button */}
              <div className="mt-6 pt-6 border-t">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Don&apos;t have an account?
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRegistration(true)}
                    className="inline-flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors duration-200 font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    New User - Request Access
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Minted Yachts. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}