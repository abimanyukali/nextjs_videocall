'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const isPremiumActive = user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date();

    return (
        <nav className="bg-gray-800 border-b border-gray-700 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
            <Link href="/">
                <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 hover:opacity-80 transition cursor-pointer">
                    RandomChat
                </div>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-gray-300 hover:text-white transition">Home</Link>
                <Link href="/about" className="text-gray-300 hover:text-white transition">About</Link>
                <Link href="/contact" className="text-gray-300 hover:text-white transition">Contact</Link>
            </div>

            <div className="flex items-center space-x-3">
                {user ? (
                    <>
                        {user.isEmailVerified || user.googleId ? (
                            isPremiumActive ? (
                                <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-full">
                                    ⭐ Premium
                                </span>
                            ) : (
                                <Link href="/premium">
                                    <button className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-full transition">
                                        ⚡ Upgrade
                                    </button>
                                </Link>
                            )
                        ) : (
                            <Link href="/chat">
                                <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full uppercase tracking-tighter hover:bg-amber-500/20 transition-colors cursor-pointer animate-pulse">
                                    ⚠️ Verify Email
                                </span>
                            </Link>
                        )}
                        <span className="text-sm text-gray-400 hidden sm:inline-block">Hey, {user.name}</span>
                        <button
                            onClick={logout}
                            className="text-sm font-medium text-gray-300 hover:text-white transition"
                        >
                            Sign Out
                        </button>
                        <Link href="/chat">
                            <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold transition">
                                Enter Chat
                            </button>
                        </Link>
                    </>
                ) : (
                    <>
                        <Link href="/auth/login">
                            <button className={`text-sm font-medium transition px-3 py-2 rounded-lg ${pathname === '/auth/login' ? 'text-white bg-white/10 ring-1 ring-white/20' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                                Sign In
                            </button>
                        </Link>
                        <Link href="/auth/register">
                            <button className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${pathname === '/auth/register' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-800' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}>
                                Sign Up
                            </button>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
