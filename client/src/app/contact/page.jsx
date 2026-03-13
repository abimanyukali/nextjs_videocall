export default function ContactPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-24 w-full flex-1 flex flex-col justify-center">
            <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                Contact Us
            </h1>
            <p className="text-gray-400 mb-10 text-lg">
                Have questions, feedback, or need support? We're here to help.
            </p>

            <form className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl flex flex-col space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                        type="text"
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        placeholder="Your name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                        type="email"
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        placeholder="you@example.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                    <textarea
                        rows={5}
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
                        placeholder="How can we help?"
                    ></textarea>
                </div>
                <button
                    type="button"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                    Send Message
                </button>
            </form>
        </div>
    );
}
