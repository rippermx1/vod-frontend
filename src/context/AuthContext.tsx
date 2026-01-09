import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'creator' | 'consumer';
    kyc_status?: string;
    monthly_price?: number;
    subscription_enabled?: boolean;
    bio?: string;
    avatar_url?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user?: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            refreshUser().finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [token]);

    const refreshUser = async () => {
        if (!token) return;
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch (error) {
            console.error("Failed to refresh user", error);
            // Optional: logout if 401?
        }
    };

    const login = (newToken: string, newUser?: User) => {
        localStorage.setItem('access_token', newToken);
        setToken(newToken);
        if (newUser) {
            setUser(newUser);
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
