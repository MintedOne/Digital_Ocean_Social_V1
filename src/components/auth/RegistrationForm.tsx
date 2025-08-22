'use client';

import { useState, FormEvent } from 'react';
import { validateEmail } from '@/lib/auth/email-validator';

interface RegistrationFormProps {
  onSubmit: (email: string, firstName?: string, lastName?: string, phoneNumber?: string) => Promise<void>;
  isLoading?: boolean;
  onBackToLogin: () => void;
}

export default function RegistrationForm({ onSubmit, isLoading = false, onBackToLogin }: RegistrationFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
    
    try {
      setIsSubmitting(true);
      await onSubmit(
        validation.normalizedEmail, 
        firstName.trim() || undefined,
        lastName.trim() || undefined,
        phoneNumber.trim() || undefined
      );
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      if (err.message !== 'An account with this email already exists. Please try signing in instead.') {
        setEmail(''); // Clear email on error except for duplicate account
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address <span className="text-red-500">*</span>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setError(''); // Clear error on input change
            }}
            placeholder="John"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400"
            disabled={isDisabled}
            autoComplete="given-name"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setError(''); // Clear error on input change
            }}
            placeholder="Doe"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400"
            disabled={isDisabled}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            setError(''); // Clear error on input change
          }}
          placeholder="+1 (555) 123-4567"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400"
          disabled={isDisabled}
          autoComplete="tel"
        />
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <p className="font-medium text-blue-800 mb-1">What happens next?</p>
        <ul className="space-y-1 text-blue-700">
          <li>1. Your account request will be sent to administrators</li>
          <li>2. Once approved, you'll receive an email with password setup instructions</li>
          <li>3. After setting your password, you can sign in to access your dashboard</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={isDisabled}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
            ${isDisabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
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
              Creating Account...
            </span>
          ) : (
            'Request Account Access'
          )}
        </button>

        <button
          type="button"
          onClick={onBackToLogin}
          disabled={isDisabled}
          className="w-full py-3 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back to Sign In
        </button>
      </div>

      <div className="mt-6 border-t pt-6">
        <p className="text-center text-sm text-gray-600">
          All fields except email are optional but help us provide better service
        </p>
      </div>
    </form>
  );
}