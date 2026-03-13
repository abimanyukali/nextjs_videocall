import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">RandomChat</h3>
                    <p className="text-gray-400 max-w-xs">
                        Connect instantly with random people around the world. Secure, fast, and completely anonymous if you choose.
                    </p>
                </div>

                <div className="flex flex-col space-y-2">
                    <h4 className="text-white font-medium mb-2">Legal</h4>
                    <Link href="/privacy" className="text-gray-400 hover:text-white transition">Privacy Policy</Link>
                    <Link href="/terms" className="text-gray-400 hover:text-white transition">Terms of Service</Link>
                    <span className="text-gray-500 mt-2 text-xs">Users must be 18+ to use this service.</span>
                </div>

                <div className="flex flex-col space-y-2">
                    <h4 className="text-white font-medium mb-2">Contact</h4>
                    <span className="text-gray-400">123 VideoCall Avenue</span>
                    <span className="text-gray-400">Tech City, TX 75001</span>
                    <a href="mailto:support@randomchat.live" className="text-blue-400 hover:text-blue-300 transition">
                        support@randomchat.example.com
                    </a>
                </div>
            </div>
            <div className="text-center text-gray-500 text-xs mt-8 pt-4 border-t border-gray-800">
                &copy; {new Date().getFullYear()} RandomChat Inc. All rights reserved.
            </div>
        </footer>
    );
}
