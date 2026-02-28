import "./globals.css";

export const metadata = {
    title: "Random Video Call",
    description: "Connect with random people instantly",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
