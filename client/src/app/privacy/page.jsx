export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-24">
            <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>
            <div className="prose prose-invert max-w-none text-gray-300 space-y-6">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
                <div>
                    When you use RandomChat, we may collect the following information:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Account details (email, name) if you choose to register.</li>
                        <li>Usage data such as connection logs (timestamps, call durations).</li>
                        <li>Information related to moderation reports and blocking.</li>
                    </ul>
                </div>

                <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Video and Audio Data</h2>
                <p>
                    We do <strong>not</strong> record, store, or monitor your video and audio data.
                    Calls are established using WebRTC, and media streams flow peer-to-peer
                    (directly between users) whenever possible. In cases where TURN servers are required
                    for connectivity, data is simply relayed and instantly discarded.
                </p>

                <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. How We Use Your Data</h2>
                <p>
                    We use your information solely to provide, maintain, and improve our services,
                    manage your account, and ensure platform safety.
                </p>

                <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Sharing Your Information</h2>
                <p>
                    We do not sell your personal data. We may share information with law enforcement agencies
                    if legally required or to protect our users' safety.
                </p>
            </div>
        </div>
    );
}
