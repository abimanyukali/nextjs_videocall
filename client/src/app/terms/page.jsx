export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-24">
            <h1 className="text-4xl font-bold mb-8 text-white">Terms of Service</h1>
            <div className="prose prose-invert max-w-none text-gray-300 space-y-6">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
                <p>
                    By accessing and using RandomChat, you accept and agree to be bound by the terms
                    and provision of this agreement.
                </p>

                <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Age Restriction</h2>
                <p>
                    You must be at least 18 years of age to use this service. By using this website,
                    you warrant that you are at least 18 years old. If you are under 18,
                    you must leave this site immediately.
                </p>

                <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. User Conduct</h2>
                <p>Users agree to not use the service to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Transmit any content that is unlawful, harmful, threatening, abusive, harassing, or otherwise objectionable.</li>
                    <li>Impersonate any person or entity.</li>
                    <li>Violate any applicable local, state, national, or international laws.</li>
                </ul>

                <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Moderation</h2>
                <p>
                    We reserve the right, but not the obligation, to monitor and moderate the platform. We may suspend or terminate accounts that violate these terms without prior notice.
                </p>

                <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Premium Subscription</h2>
                <p>
                    Premium membership is available for ₹100 per day (24 hours). Premium users receive enhanced features including camera/microphone controls, camera switching, and extended call durations. All payments are processed securely via Razorpay. Subscriptions are non-refundable once activated.
                </p>
            </div>
        </div>
    );
}
