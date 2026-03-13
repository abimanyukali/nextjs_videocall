import "./globals.css";
import Providers from "../components/Providers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata = {
    title: "Random Video Call 18+",
    description: "Connect with random people instantly in a secure, fun environment.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="antialiased bg-gray-950 text-gray-100 min-h-screen flex flex-col">
                <Providers>
                    <Navbar />
                    <main className="flex-1 flex flex-col">
                        {children}
                    </main>
                    <Footer />
                </Providers>
            </body>
        </html>
    );
}
