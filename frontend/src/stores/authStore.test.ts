import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
    beforeEach(() => {
        useAuthStore.getState().clearUser();
    });

    it('should set the user correctly', () => {
        const user = { id: 'u1', email: 'test@example.com' };
        useAuthStore.getState().setUser(user);
        expect(useAuthStore.getState().user).toEqual(user);
    });

    it('should set the access token correctly', () => {
        const token = 'fake-token';
        useAuthStore.getState().setAccessToken(token);
        expect(useAuthStore.getState().accessToken).toBe(token);
    });

    it('should clear the user and token', () => {
        useAuthStore.getState().setUser({ id: 'u1', email: 'e' });
        useAuthStore.getState().setAccessToken('t');
        useAuthStore.getState().clearUser();
        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().accessToken).toBeNull();
    });
});
