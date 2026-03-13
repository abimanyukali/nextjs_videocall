'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import VideoCall from '../../components/VideoCall';
import api from '../../lib/api';

export default function ChatPage() {
    const { user, verifyAge, loading, checkUserLoggedIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [showAgeModal, setShowAgeModal] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resendStatus, setResendStatus] = useState(''); // '', 'loading', 'success', 'error'
    const [verificationOutcome, setVerificationOutcome] = useState(null); // 'success', 'expired', 'invalid'

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        } else if (user && !user.ageVerified) {
            setShowAgeModal(true);
        }

        // Handle verification query params from backend redirect
        const verified = searchParams.get('verified');
        const error = searchParams.get('error');

        if (verified === 'true') {
            setVerificationOutcome('success');
            checkUserLoggedIn(); // Refresh local user state
            // Clean up URL
            window.history.replaceState({}, '', '/chat');
            setTimeout(() => setVerificationOutcome(null), 5000);
        } else if (error === 'expired') {
            setVerificationOutcome('expired');
            window.history.replaceState({}, '', '/chat');
        } else if (error === 'invalid_token') {
            setVerificationOutcome('invalid');
            window.history.replaceState({}, '', '/chat');
        }
    }, [user, loading, router, searchParams, checkUserLoggedIn]);

    const handleVerifyAge = async () => {
        setVerifying(true);
        try {
            await verifyAge();
            setShowAgeModal(false);
        } catch (err) {
            console.error(err);
        } finally {
            setVerifying(false);
        }
    };

    const handleResendEmail = async () => {
        setResendStatus('loading');
        setVerificationOutcome(null); // Clear expiry error if we are retrying
        try {
            await api.post('/auth/resend-verification');
            setResendStatus('success');
            setTimeout(() => setResendStatus(''), 5000);
        } catch (err) {
            console.error(err);
            setResendStatus('error');
            setTimeout(() => setResendStatus(''), 5000);
        }
    };

    const handleCancel = () => {
        router.push('/');
    };

    if (loading || !user) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-950 text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 font-medium tracking-wide font-mono">RETRIEVING PROFILE...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex-1 bg-black w-full h-[100dvh] overflow-hidden">
            {/* 🛑 Email Verification Gate */}
            {!user.isEmailVerified && !user.googleId ? (
                <div className="absolute inset-0 z-50 bg-gray-950/40 backdrop-blur-2xl flex items-center justify-center p-4">
                    <div className="bg-gray-900/90 border border-white/5 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-md w-full text-center relative overflow-hidden group">
                        {/* Decorative background glow */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-colors duration-700" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] group-hover:bg-purple-500/20 transition-colors duration-700" />

                        <div className="relative z-10">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg transform transition-all duration-500 ${
                                verificationOutcome === 'expired' || verificationOutcome === 'invalid' 
                                ? 'bg-red-500 text-white shadow-red-500/20 rotate-6' 
                                : 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-indigo-500/20 -rotate-3 group-hover:rotate-0'
                            }`}>
                                {verificationOutcome === 'expired' || verificationOutcome === 'invalid' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </div>

                            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
                                {verificationOutcome === 'expired' ? 'Link Expired' : verificationOutcome === 'invalid' ? 'Invalid Link' : 'Verify Your Email'}
                            </h2>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                {verificationOutcome === 'expired' 
                                    ? 'The verification link has expired (2 min limit). Please request a new one below.' 
                                    : verificationOutcome === 'invalid'
                                    ? 'This link is no longer valid or has already been used.'
                                    : 'To maintain a safe environment, we sent a verification link to your email. Confirm it to unlock the chat!'}
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={handleResendEmail}
                                    disabled={resendStatus === 'loading' || resendStatus === 'success'}
                                    className={`w-full py-4 px-6 rounded-2xl font-bold tracking-wide transition-all duration-300 shadow-xl flex items-center justify-center gap-3 ${
                                        resendStatus === 'loading'
                                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                            : resendStatus === 'success'
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : resendStatus === 'error'
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : verificationOutcome === 'expired' || verificationOutcome === 'invalid'
                                            ? 'bg-red-600 hover:bg-red-500 text-white hover:scale-[1.02] shadow-red-600/20'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] shadow-indigo-600/20'
                                    }`}
                                >
                                    {resendStatus === 'loading' && (
                                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    )}
                                    <span>
                                        {resendStatus === 'loading'
                                            ? 'Sending...'
                                            : resendStatus === 'success'
                                            ? 'New Link Sent!'
                                            : resendStatus === 'error'
                                            ? 'Error Sending'
                                            : (verificationOutcome === 'expired' || verificationOutcome === 'invalid') 
                                                ? 'Request New Link' 
                                                : '📩 Resend Verification Link'}
                                    </span>
                                </button>

                                <button
                                    onClick={() => router.push('/')}
                                    className="w-full py-4 px-6 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl font-bold transition-colors"
                                >
                                    Go Back Home
                                </button>
                            </div>

                            <p className="mt-8 text-[11px] text-gray-600 uppercase tracking-widest font-black">
                                {verificationOutcome === 'expired' ? 'Link lasts only 2 minutes' : 'Strictly One-Time Verification'}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Success notification if just verified */}
                    {verificationOutcome === 'success' && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
                            <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black shadow-2xl shadow-emerald-500/30 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Email Verified Successfully!
                            </div>
                        </div>
                    )}
                    <VideoCall token="use-cookie" isPremiumUser={!!(user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date())} />
                </>
            )}

            {/* 🔞 Age Verification Modal */}
            {showAgeModal && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-gray-950 border border-white/5 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-2xl font-black">18+</span>
                        </div>
                        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Identity Confirmation</h2>
                        <div className="bg-red-500/5 text-red-400/80 p-5 rounded-2xl mb-8 text-sm text-left border border-red-500/10 leading-relaxed font-medium">
                            <strong>Policy:</strong> This network contains live connections. You must be at least 18 years old. We strictly prohibit bots and minor interaction.
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleVerifyAge}
                                disabled={verifying}
                                className="w-full py-4 px-6 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black tracking-wide transition-all active:scale-[0.98] shadow-xl shadow-red-600/20 disabled:opacity-50"
                            >
                                {verifying ? 'VERIFYING...' : 'I AM 18+ (ENTER)'}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="w-full py-3 px-6 text-gray-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
                            >
                                Exit Site
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
