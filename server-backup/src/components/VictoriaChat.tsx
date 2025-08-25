'use client';

import { useChat } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import StaticWelcome from './StaticWelcome';

interface VictoriaChatProps {
  onBackToHome?: () => void;
}

export default function VictoriaChat({ onBackToHome }: VictoriaChatProps = {}) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/victoria/chat',
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: (message) => {
      console.log('Message finished:', message.content.length, 'characters');
      // Start typing animation only when message is completely finished
      if (message.role === 'assistant' && !displayedMessages[message.id]) {
        startTypingAnimation(message);
      }
    }
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [displayedMessages, setDisplayedMessages] = useState<{[key: string]: string}>({});
  const [showTyping, setShowTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedMessages]);

  // Handle "Victoria is typing..." with delay
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowTyping(true);
      }, 500); // 0.5 second delay
      
      return () => {
        clearTimeout(timer);
        setShowTyping(false);
      };
    } else {
      setShowTyping(false);
    }
  }, [isLoading]);

  // Start typing animation for a specific message (word by word)
  const startTypingAnimation = (message: any) => {
    console.log('Starting typing for message:', message.id, 'Length:', message.content.length);
    
    // Add line breaks after sentences for readability
    const textWithBreaks = message.content
      .replace(/\. /g, '.\n')
      .replace(/\? /g, '?\n')
      .replace(/\! /g, '!\n');
    
    const words = textWithBreaks.split(' ');
    let currentWordIndex = 0;
    
    const typeWords = () => {
      if (currentWordIndex <= words.length) {
        const displayText = words.slice(0, currentWordIndex).join(' ');
        setDisplayedMessages(prev => ({
          ...prev,
          [message.id]: displayText
        }));
        currentWordIndex++;
        setTimeout(typeWords, 160); // 160ms = 20% faster than 200ms
      } else {
        console.log('Finished typing message:', message.id);
      }
    };
    
    typeWords();
  };

  // Test scenario handlers
  const sendTestMessage = (message: string) => {
    // Create a proper synthetic event for input change
    const inputEvent = {
      preventDefault: () => {},
      target: { value: message }
    } as any;
    
    // Create a separate synthetic event for form submit
    const submitEvent = {
      preventDefault: () => {},
    } as any;
    
    // Set the input value and submit
    handleInputChange(inputEvent);
    setTimeout(() => handleSubmit(submitEvent), 100);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold">Victoria Sterling</h1>
              <p className="text-blue-200 text-sm">Yacht Consultant • $200k-$5M Market Specialist</p>
            </div>
          </div>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="flex items-center space-x-2 bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back to Portal</span>
            </button>
          )}
        </div>
      </div>

      {/* Test Scenarios - Show only when no conversation started */}
      {messages.length === 0 && (
        <div className="bg-white border-b border-blue-200 p-4 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Test Scenarios:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <button
              onClick={() => sendTestMessage("I'm interested in buying my first yacht")}
              className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-sm transition-colors"
            >
              <div className="font-medium text-blue-800">First Time Buyer</div>
              <div className="text-blue-600">New to yachting</div>
            </button>
            <button
              onClick={() => sendTestMessage("I'm looking to upgrade from my current 35-footer")}
              className="text-left p-3 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 text-sm transition-colors"
            >
              <div className="font-medium text-amber-800">Upgrade Buyer</div>
              <div className="text-amber-600">Looking to trade up</div>
            </button>
            <button
              onClick={() => sendTestMessage("I need help finding the right yacht for my needs")}
              className="text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-sm transition-colors"
            >
              <div className="font-medium text-green-800">Need Guidance</div>
              <div className="text-green-600">Help me choose</div>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
        <StaticWelcome />
        
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start space-x-3 ${
            message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
              message.role === 'user' 
                ? 'bg-gradient-to-br from-amber-600 to-amber-700' 
                : 'bg-gradient-to-br from-blue-900 to-amber-600'
            }`}>
              {message.role === 'user' ? 'U' : 'V'}
            </div>
            <div className="flex-1 max-w-xs sm:max-w-md md:max-w-lg">
              <div className={`rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white ml-auto'
                  : 'bg-gradient-to-r from-blue-50 to-amber-50 border border-blue-200 text-gray-800'
              }`}>
                <p className="leading-relaxed whitespace-pre-line">
                  {message.role === 'assistant' ? (
                    <>
                      {displayedMessages[message.id] ? (
                        <>
                          {displayedMessages[message.id]}
                          {displayedMessages[message.id].length < message.content.length && (
                            <span className="animate-pulse">|</span>
                          )}
                        </>
                      ) : (
                        showTyping && messages[messages.length - 1].id === message.id ? (
                          <span className="text-gray-500 italic">Victoria is typing...</span>
                        ) : null
                      )}
                    </>
                  ) : (
                    message.content
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-blue-200 flex-shrink-0">
        <div className="flex space-x-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask Victoria about yachts..."
            className="flex-1 border border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}