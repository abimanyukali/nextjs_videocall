export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-24">
            <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                About RandomChat
            </h1>
            <div className="space-y-6 text-gray-300 leading-relaxed text-lg">
                <p>
                    Welcome to RandomChat, the ultimate platform for instantaneous global connections.
                    Our mission is to break down barriers and connect people from all walks of life
                    in a secure, fun, and spontaneous environment.
                </p>
                <p>
                    Built with cutting-edge WebRTC technology, RandomChat provides high-quality,
                    low-latency video and audio calls directly in your browser. No downloads,
                    no complex setups—just click, connect, and converse.
                </p>
                <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Our Values</h2>
                <ul className="list-disc list-inside space-y-3 pl-4">
                    <li><strong className="text-indigo-400">Privacy First:</strong> Your personal data is protected and we do not record your private calls.</li>
                    <li><strong className="text-indigo-400">Safety:</strong> We provide robust reporting and blocking features to maintain a clean community.</li>
                    <li><strong className="text-indigo-400">Simplicity:</strong> Fast, intuitive, and seamless user experience.</li>
                </ul>
            </div>
        </div>
    );
}
