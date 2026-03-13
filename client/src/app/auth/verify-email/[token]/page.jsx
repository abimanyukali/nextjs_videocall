'use client';

import { useEffect, useState, useRef } from 'react';
import api from '../../../../lib/api';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  const router = useRouter();
  const params = useParams();
  const { checkUserLoggedIn } = useAuth();

  // Prevent double execution in React Strict Mode
  const hasCalled = useRef(false);

  useEffect(() => {
    if (!params.token || hasCalled.current) return;
    hasCalled.current = true;

    const verifyToken = async () => {
      try {
        console.log('token', params.token);
        const { data } = await api.get(`/auth/verify-email/${params.token}`);

        setMessage(data.message || 'Email successfully verified!');
        setStatus('success');

        // Refresh global user state to catch the new isEmailVerified flag
        await checkUserLoggedIn();

        setTimeout(() => {
          router.push('/chat');
        }, 3000);
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
            'Invalid or expired verification token.',
        );
      }
    };

    verifyToken();
  }, [params.token, router, checkUserLoggedIn]);

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gray-950">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Verifying Email...
            </h1>
            <p className="text-gray-400">
              Please wait while we confirm your address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verified!</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <p className="text-sm text-indigo-400">
              Redirecting you to chat...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-400 mb-8">{message}</p>
            <Link
              href="/auth/login"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
