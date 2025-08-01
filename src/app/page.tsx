'use client';

import { useState } from 'react';
import VictoriaChat from "@/components/VictoriaChat";

export default function Home() {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return <VictoriaChat onBackToHome={() => setShowChat(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">Minted Yachts</h1>
          <p className="text-blue-200 mt-2">Your Premium Yacht Consultancy Portal</p>
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
            From $200k family cruisers to $5M+ luxury vessels, we're here to guide your journey.
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
              Generate professional YouTube scripts and metadata for yacht marketing videos.
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