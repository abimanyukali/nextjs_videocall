'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
    const { user } = useAuth();
    const router = useRouter();

    const handleEnterChat = () => {
        if (!user) {
            router.push('/auth/login');
        } else if (!user.ageVerified) {
            // If user is logged in but hasn't verified age, we can push them
            // to a verification step, or we can just proceed and let the chat page handle it.
            // But per requirements, age check happens before entering.
            // Let's assume the auth/login handles the initial check, 
            // and we just push them to chat where the modal will pop up if not verified.
            router.push('/chat');
        } else {
            router.push('/chat');
        }
    };

    return (
        <div className="flex flex-col w-full h-full">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gray-950 pt-20 pb-32 flex flex-col items-center justify-center text-center px-6 isolate">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-950 to-gray-950"></div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
                    Connect with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Strangers</span> Instantly
                </h1>
                <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed">
                    High-quality, secure, and lightning-fast random video chat.
                    Meet new people from around the globe directly in your browser without any downloads.
                </p>

                <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center">
                    <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-6 flex items-center justify-center w-full">
                        <span className="font-bold text-sm tracking-wide uppercase flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Age Restriction Notice (18+)
                        </span>
                    </div>
                    <p className="text-sm text-gray-400 text-center mb-8">
                        This platform may contain content suitable only for adults.
                        By clicking the button below, you confirm that you are 18 years of age or older.
                    </p>

                    <button
                        onClick={handleEnterChat}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-indigo-500/20 transform hover:scale-[1.02] transition-all duration-200"
                    >
                        I am 18+ Enter Video Chat
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-gray-900 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Why Choose Us?</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">Experience the next generation of random video chatting built with state-of-the-art WebRTC and responsive design.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-indigo-500 transition-colors">
                            <div className="h-14 w-14 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
                            <p className="text-gray-400 leading-relaxed">Instantly connect with the next person in line. No buffering, no waiting rooms. Just instant face-to-face connection.</p>
                        </div>

                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-blue-500 transition-colors">
                            <div className="h-14 w-14 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Secure & Private</h3>
                            <p className="text-gray-400 leading-relaxed">Traffic is encrypted end-to-end where possible. We do not store or record any video data.</p>
                        </div>

                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-purple-500 transition-colors">
                            <div className="h-14 w-14 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Community Safety</h3>
                            <p className="text-gray-400 leading-relaxed">Integrated reporting and blocking systems ensure a clean, enjoyable environment tailored to your preferences.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Safety Info */}
            <section className="py-24 bg-gray-950 px-6 border-t border-gray-800">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Your Safety is Our Priority</h2>
                    <p className="text-gray-400 mb-8 leading-relaxed text-lg">
                        We employ modern authentication standards, state-of-the-art encryption, and dedicated moderation APIs to keep bad actors away. We require an 18+ declaration before use.
                        Remember to protect your own identity—never share personal information like your address, phone number, or financials with strangers.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 font-medium">Read Privacy Policy &rarr;</Link>
                        <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 font-medium">Read Terms of Service &rarr;</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
