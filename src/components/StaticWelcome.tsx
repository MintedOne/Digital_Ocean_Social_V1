'use client';

import { useState, useEffect } from 'react';
import { VICTORIA_PERSONA } from '@/lib/victoria/persona';

export default function StaticWelcome() {
  const [displayText, setDisplayText] = useState('');
  const fullText = VICTORIA_PERSONA.welcomeMessage;

  useEffect(() => {
    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, 35);

    return () => clearInterval(timer);
  }, [fullText]);

  return (
    <div className="flex items-start space-x-3 p-4">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
        V
      </div>
      <div className="flex-1">
        <div className="bg-gradient-to-r from-blue-50 to-amber-50 border border-blue-200 rounded-lg p-3">
          <p className="text-gray-800 leading-relaxed">
            {displayText}
            <span className="animate-pulse">|</span>
          </p>
        </div>
      </div>
    </div>
  );
}