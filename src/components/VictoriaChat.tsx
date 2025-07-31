'use client';

import { useChat } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import StaticWelcome from './StaticWelcome';

export default function VictoriaChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/victoria/chat',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [displayedMessages, setDisplayedMessages] = useState<{[key: string]: string}>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedMessages]);

  useEffect(() => {
    messages.forEach((message) => {
      if (message.role === 'assistant' && !displayedMessages[message.id]) {
        let currentIndex = 0;
        const fullText = message.content;
        
        const timer = setInterval(() => {
          if (currentIndex <= fullText.length) {
            setDisplayedMessages(prev => ({
              ...prev,
              [message.id]: fullText.substring(0, currentIndex)
            }));
            currentIndex++;
          } else {
            clearInterval(timer);
          }
        }, 35);

        return () => clearInterval(timer);
      }
    });
  }, [messages, displayedMessages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
            V
          </div>
          <div>
            <h1 className="text-xl font-bold">Victoria Sterling</h1>
            <p className="text-blue-200 text-sm">Yacht Consultant • $200k-$5M Market Specialist</p>
          </div>
        </div>
      </div>

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
                <p className="leading-relaxed">
                  {message.role === 'assistant' && isLoading && !displayedMessages[message.id] ? (
                    <span className="opacity-0">Loading...</span>
                  ) : (
                    <>
                      {message.role === 'assistant' ? displayedMessages[message.id] || message.content : message.content}
                      {message.role === 'assistant' && displayedMessages[message.id] && displayedMessages[message.id].length < message.content.length && (
                        <span className="animate-pulse">|</span>
                      )}
                    </>
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
            className="flex-1 border border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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