'use client';

import { useState, useEffect, useRef } from 'react';
import VictoriaChat from "@/components/VictoriaChat";

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  
  // YouTube OAuth states
  const [youtubeAuthStatus, setYoutubeAuthStatus] = useState<{
    authenticated: boolean;
    channelName?: string;
    channelId?: string;
  }>({ authenticated: false });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // User profile dropdown states
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    email: string;
    displayName: string;
    role: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkYouTubeAuthStatus();
    checkUserAuthStatus();
    
    // Check for auth success/error params in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth_success') === 'true') {
      checkYouTubeAuthStatus();
      // Remove the parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const checkYouTubeAuthStatus = async () => {
    try {
      setIsCheckingAuth(true);
      const response = await fetch('/api/youtube/status');
      const data = await response.json();
      
      if (data.success) {
        setYoutubeAuthStatus({
          authenticated: data.authenticated,
          channelName: data.channelName,
          channelId: data.channelId
        });
      }
    } catch (error) {
      console.error('Failed to check YouTube auth status:', error);
      setYoutubeAuthStatus({ authenticated: false });
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const checkUserAuthStatus = async () => {
    try {
      console.log('🔍 Checking user auth status...');
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      console.log('🔍 Auth response:', data);
      
      if (data.authenticated && data.user) {
        console.log('✅ User authenticated:', data.user);
        setUserProfile({
          email: data.user.email,
          displayName: data.user.displayName,
          role: data.user.role
        });
      } else {
        console.log('❌ User not authenticated');
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Failed to check user auth status:', error);
      setUserProfile(null);
    }
  };

  const handleYouTubeAuth = async () => {
    try {
      const response = await fetch('/api/youtube/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'authenticate' })
      });
      
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        // Open OAuth URL in new window
        window.open(data.authUrl, '_blank', 'width=600,height=600');
      }
    } catch (error) {
      console.error('YouTube auth failed:', error);
    }
  };

  const handleYouTubeLogout = async () => {
    try {
      const response = await fetch('/api/youtube/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
      
      if (response.ok) {
        setYoutubeAuthStatus({ authenticated: false });
      }
    } catch (error) {
      console.error('YouTube logout failed:', error);
    }
  };

  const handleUserLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('User logout failed:', error);
      // Fallback to direct navigation
      window.location.href = '/login';
    }
  };

  // Debug logging
  console.log('User Profile State:', userProfile);

  if (showChat) {
    return <VictoriaChat onBackToHome={() => setShowChat(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Minted Yachts</h1>
              <p className="text-blue-200 mt-2">Your Premium Yacht Consultancy Portal</p>
            </div>
            
            <div className="flex items-center justify-between gap-8">
              {/* YouTube Status Section - Left */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <div>
                    {isCheckingAuth ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-white/90">Checking YouTube...</span>
                      </div>
                    ) : youtubeAuthStatus.authenticated ? (
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <span className="text-sm font-medium text-white">YouTube Connected</span>
                        </div>
                        {youtubeAuthStatus.channelName && (
                          <p className="text-xs text-blue-200 mt-1">{youtubeAuthStatus.channelName}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-white/90">YouTube Disconnected</span>
                      </div>
                    )}
                  </div>
                  <div className="border-l border-white/20 pl-3">
                    {!isCheckingAuth && (
                      !youtubeAuthStatus.authenticated ? (
                        <button
                          onClick={handleYouTubeAuth}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors"
                        >
                          🔐 Connect
                        </button>
                      ) : (
                        <button
                          onClick={handleYouTubeLogout}
                          className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors"
                        >
                          🚪 Disconnect
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
              
              {/* User Profile Section - Right */}
              {(userProfile || true) && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-3 rounded-lg font-medium transition-colors border border-white/20 flex items-center gap-2"
                  >
                    {/* User Avatar */}
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <span className="hidden sm:block">{userProfile?.displayName || 'User'}</span>
                    <svg className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{userProfile?.displayName || 'Guest User'}</p>
                        <p className="text-xs text-gray-600">{userProfile?.email || 'No email'}</p>
                        <span className={`inline-block px-2 py-1 mt-1 rounded-full text-xs font-medium ${
                          userProfile?.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {userProfile?.role || 'guest'}
                        </span>
                      </div>

                      {/* Menu Items */}
                      <a
                        href="/auth-status"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Authentication Status
                      </a>

                      <button
                        onClick={handleUserLogout}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        System Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-blue-900 mb-4">
            Welcome to Minted Yachts
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover your perfect yacht with our expert consultants and comprehensive market knowledge. 
            From $200k family cruisers to $5M+ luxury vessels, we&apos;re here to guide your journey.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Victoria Chat Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4">
              V
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">
              Chat with Victoria Sterling
            </h3>
            <p className="text-gray-600 mb-4">
              Connect with our AI yacht consultant for personalized recommendations and expert guidance.
            </p>
            <button
              onClick={() => setShowChat(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
            >
              Start Consultation
            </button>
          </div>

          {/* Coming Soon Cards */}
          <div className="bg-gray-50 rounded-lg shadow-lg p-6 border border-gray-200 opacity-75">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4">
              🛥️
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Yacht Inventory
            </h3>
            <p className="text-gray-500 mb-4">
              Browse our curated selection of available yachts with detailed specifications.
            </p>
            <div className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium text-center">
              Coming Soon
            </div>
          </div>

          {/* Video Generator Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4">
              🎬
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">
              Video Generator
            </h3>
            <p className="text-gray-600 mb-4">
              Generate scripts, process videos, and upload directly to YouTube. Complete end-to-end yacht marketing workflow.
            </p>
            <a
              href="/video-generator"
              className="block w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 text-center"
            >
              Create Content
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-blue-100">
          <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center">
            Why Choose Minted Yachts?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="font-semibold text-blue-800 mb-2">Expert Guidance</h4>
              <p className="text-gray-600 text-sm">
                Professional consultants with deep market knowledge
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💎</div>
              <h4 className="font-semibold text-blue-800 mb-2">Premium Selection</h4>
              <p className="text-gray-600 text-sm">
                Curated inventory from trusted manufacturers
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🤝</div>
              <h4 className="font-semibold text-blue-800 mb-2">Personal Service</h4>
              <p className="text-gray-600 text-sm">
                Dedicated support throughout your yacht journey
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-blue-200">
            © 2025 Minted Yachts. Your journey to yacht ownership starts here.
          </p>
        </div>
      </footer>
    </div>
  );
}