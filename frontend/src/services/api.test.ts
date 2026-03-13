import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from './api';
import { useAuthStore } from '../stores/authStore';

vi.mock('../stores/authStore');

describe('api', () => {
    const originalLocation = window.location;

    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-expect-error replace location for test
        delete window.location;
        window.location = { ...originalLocation, href: '' };
    });

    afterEach(() => {
        window.location = originalLocation;
    });

    it('uses baseURL from env or localhost', () => {
        expect(api.defaults.baseURL).toBeDefined();
        expect(api.defaults.baseURL).toMatch(/\/api$/);
    });

    it('request interceptor adds Authorization when accessToken is set', async () => {
        vi.mocked(useAuthStore.getState).mockReturnValue({
            accessToken: 'fake-token',
            clearUser: vi.fn(),
            user: null,
            setUser: vi.fn(),
            setAccessToken: vi.fn(),
        } as any);

        const requestHandler = api.interceptors.request.handlers[0]?.fulfilled;
        expect(requestHandler).toBeDefined();
        const config: any = { headers: {} };
        const result = await requestHandler!(config);
        expect(result.headers.Authorization).toBe('Bearer fake-token');
    });

    it('request interceptor does not add Authorization when accessToken is null', async () => {
        vi.mocked(useAuthStore.getState).mockReturnValue({
            accessToken: null,
            clearUser: vi.fn(),
            user: null,
            setUser: vi.fn(),
            setAccessToken: vi.fn(),
        } as any);

        const requestHandler = api.interceptors.request.handlers[0]?.fulfilled;
        const config: any = { headers: {} };
        const result = await requestHandler!(config);
        expect(result.headers.Authorization).toBeUndefined();
    });

    it('on 401 response clears user and redirects to /login', async () => {
        const clearUser = vi.fn();
        vi.mocked(useAuthStore.getState).mockReturnValue({
            accessToken: 'x',
            clearUser,
            user: null,
            setUser: vi.fn(),
            setAccessToken: vi.fn(),
        } as any);

        const err401 = Object.assign(new Error('Unauthorized'), {
            response: { status: 401 },
        });
        const responseHandlers = api.interceptors.response.handlers;
        const rejected = responseHandlers[responseHandlers.length - 1]?.rejected;
        expect(rejected).toBeDefined();

        await expect(rejected!(err401)).rejects.toEqual(err401);
        expect(clearUser).toHaveBeenCalled();
        expect(window.location.href).toBe('/login');
    });
});
