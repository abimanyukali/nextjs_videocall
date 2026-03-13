'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function PremiumPage() {
    const { user, refreshUser, loading } = useAuth();
    const router = useRouter();
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    const isPremiumActive = user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date();

    const formatExpiry = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const handlePayment = async () => {
        setError('');
        setPaying(true);

        try {
            // Load Razorpay script
            await loadRazorpayScript();

            // Create order on backend
            const { data } = await api.post('/payment/create-order');

            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: 'ARL Network',
                description: 'Premium Membership — 24 Hours',
                order_id: data.orderId,
                prefill: {
                    name: data.userName,
                    email: data.userEmail,
                },
                theme: { color: '#6366f1' },
                handler: async (response) => {
                    try {
                        await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        await refreshUser();
                        setSuccess(true);
                    } catch (verifyErr) {
                        setError('Payment verification failed. Please contact support.');
                    } finally {
                        setPaying(false);
                    }
                },
                modal: {
                    ondismiss: () => setPaying(false),
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
                setError(`Payment failed: ${response.error.description}`);
                setPaying(false);
            });
            rzp.open();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
            setPaying(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-950 text-white">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-16">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-yellow-400/10 text-yellow-400 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-yellow-400/20">
                    <span>⭐</span> Premium Membership
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
                    Upgrade Your<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                        Experience
                    </span>
                </h1>
                <p className="text-gray-400 text-lg max-w-xl mx-auto">
                    Unlock full media controls, camera switching, and more. Just ₹100 for 24 hours.
                </p>
            </div>

            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Free Plan */}
                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-400 mb-1">Free</h2>
                        <p className="text-4xl font-black text-white">₹0</p>
                        <p className="text-gray-500 text-sm mt-1">Forever free</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                        {[
                            'Random video chat',
                            'Text chat',
                            'Basic matching',
                            '1 minute per call',
                            '❌ No mic/camera controls',
                            '❌ No camera switching',
                        ].map((feature, i) => (
                            <li key={i} className={`flex items-center gap-3 text-sm ${feature.startsWith('❌') ? 'text-gray-600' : 'text-gray-300'}`}>
                                {!feature.startsWith('❌') && <span className="text-emerald-400">✓</span>}
                                <span>{feature.replace('❌ ', '')}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="w-full py-3 px-6 bg-gray-800 text-gray-500 rounded-2xl text-center text-sm font-bold cursor-not-allowed">
                        Current Plan
                    </div>
                </div>

                {/* Premium Plan */}
                <div className="relative bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-pink-900/30 border border-indigo-500/50 rounded-3xl p-8 shadow-[0_0_60px_rgba(99,102,241,0.15)]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
                        Most Popular
                    </div>
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-indigo-300 mb-1">Premium</h2>
                        <div className="flex items-end gap-2">
                            <p className="text-4xl font-black text-white">₹100</p>
                            <p className="text-gray-400 text-sm mb-1">/ 24 hours</p>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">Billed per day</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                        {[
                            'Everything in Free',
                            'Mic toggle control',
                            'Camera toggle control',
                            'Switch front/rear camera',
                            'Extended call time',
                            'Priority matching',
                        ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-gray-200">
                                <span className="text-indigo-400">✓</span>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {isPremiumActive ? (
                        <div className="w-full py-3 px-6 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl text-center text-sm font-bold">
                            ✓ Active until {formatExpiry(user.premiumExpiry)}
                        </div>
                    ) : success ? (
                        <div className="w-full py-3 px-6 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl text-center text-sm font-bold">
                            🎉 Premium Activated! Enjoy 24 hours of full access.
                        </div>
                    ) : (
                        <button
                            onClick={handlePayment}
                            disabled={paying}
                            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-black tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/30"
                        >
                            {paying ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                '⚡ Upgrade Now — ₹100'
                            )}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-6 max-w-md w-full bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl text-sm text-center">
                    {error}
                </div>
            )}

            <p className="mt-8 text-gray-600 text-xs text-center max-w-sm">
                Payments are securely processed by Razorpay. By upgrading you agree to our{' '}
                <a href="/terms" className="text-gray-400 hover:text-white">Terms of Service</a>.
            </p>
        </div>
    );
}

function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve();
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.head.appendChild(script);
    });
}
