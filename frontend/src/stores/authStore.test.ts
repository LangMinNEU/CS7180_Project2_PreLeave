import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
    beforeEach(() => {
        useAuthStore.setState({ user: null, accessToken: null });
    });

    it('has initial null user and accessToken', () => {
        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.accessToken).toBeNull();
    });

    it('setUser updates user', () => {
        const user = { id: '1', email: 'a@b.com' };
        useAuthStore.getState().setUser(user);
        expect(useAuthStore.getState().user).toEqual(user);
    });

    it('setAccessToken updates accessToken', () => {
        useAuthStore.getState().setAccessToken('token123');
        expect(useAuthStore.getState().accessToken).toBe('token123');
    });

    it('clearUser resets user and accessToken', () => {
        useAuthStore.getState().setUser({ id: '1', email: 'a@b.com' });
        useAuthStore.getState().setAccessToken('t');
        useAuthStore.getState().clearUser();
        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().accessToken).toBeNull();
    });
});
