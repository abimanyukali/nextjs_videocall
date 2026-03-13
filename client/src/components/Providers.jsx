'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../context/AuthContext';

export default function Providers({ children }) {
    // Use a placeholder if GOOGLE_CLIENT_ID is not set in env yet
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your_google_client_id_here';

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <AuthProvider>{children}</AuthProvider>
        </GoogleOAuthProvider>
    );
}
