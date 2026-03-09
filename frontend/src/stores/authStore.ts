import { create } from 'zustand';

interface User {
    id: string;
    email: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    setUser: (user: User) => void;
    setAccessToken: (token: string) => void;
    clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    setUser: (user) => set({ user }),
    setAccessToken: (accessToken) => set({ accessToken }),
    clearUser: () => set({ user: null, accessToken: null }),
}));
