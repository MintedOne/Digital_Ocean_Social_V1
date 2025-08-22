'use client';

import { useState, FormEvent } from 'react';
import { validateEmail, generateDisplayName } from '@/lib/auth/email-validator';

interface LoginFormProps {
  onSubmit: (email: string, displayName: string) => Promise<void>;
  isLoading?: boolean;
}

export default function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate email
    const validation = validateEmail(email);
    
    if (!validation.isValid) {
      setError(validation.error || 'Invalid email address');
      setEmail(''); // Clear the invalid email
      return;
    }
    
    if (!validation.normalizedEmail) {
      setError('Unable to process email address');
      setEmail(''); // Clear the invalid email
      return;
    }
    
    // Generate display name from email
    const displayName = generateDisplayName(validation.normalizedEmail);
    
    try {
      setIsSubmitting(true);
      await onSubmit(validation.normalizedEmail, displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setEmail(''); // Clear the email on login failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(''); // Clear error on input change
          }}
          placeholder="your.name@email.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400"
          disabled={isDisabled}
          required
          autoComplete="email"
          autoFocus
        />
        <p className="mt-2 text-sm text-gray-500">
          Enter your email address
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isDisabled}
        className={`
          w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
          ${isDisabled 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800'
          }
        `}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg 
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </button>

      <div className="mt-6 border-t pt-6">
        <p className="text-center text-sm text-gray-600">
          Access restricted to Minted Yachts team members
        </p>
      </div>
    </form>
  );
}