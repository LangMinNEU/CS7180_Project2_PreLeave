import { create } from 'zustand';

interface User {
    id: string;
    email: string;
}

interface AuthState {
    // Access token kept in memory only — never localStorage (per security rules)
    accessToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    setAuth: (token: string, user: User) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    setAuth: (token, user) =>
        set({ accessToken: token, user, isAuthenticated: true }),
    clearAuth: () =>
        set({ accessToken: null, user: null, isAuthenticated: false }),
}));
