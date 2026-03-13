'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        try {
            const { data } = await api.get('/auth/profile');
            setUser(data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        setUser(data);
        return data;
    };

    const register = async (name, email, password, isHuman) => {
        const { data } = await api.post('/auth/register', { name, email, password, isHuman });
        setUser(data);
        return data;
    };

    const verifyAge = async () => {
        const { data } = await api.put('/auth/verify-age');
        setUser(data);
        return data;
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
        router.push('/');
    };

    // Refresh user from server (e.g. after premium payment)
    const refreshUser = async () => {
        try {
            const { data } = await api.get('/auth/profile');
            setUser(data);
            return data;
        } catch (error) {
            console.error('Failed to refresh user', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                verifyAge,
                logout,
                checkUserLoggedIn,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
