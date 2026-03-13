import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as pushService from './pushNotificationService';
import api from './api';

vi.mock('./api');

describe('pushNotificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('hasPushPermission', () => {
        it('returns false when Notification is not in window', () => {
            const win = globalThis as any;
            const orig = win.Notification;
            delete win.Notification;
            expect(pushService.hasPushPermission()).toBe(false);
            win.Notification = orig;
        });

        it('returns true when Notification.permission is granted', () => {
            const orig = (global as any).Notification;
            (global as any).Notification = { permission: 'granted' };
            expect(pushService.hasPushPermission()).toBe(true);
            (global as any).Notification = orig;
        });

        it('returns false when Notification.permission is not granted', () => {
            const orig = (global as any).Notification;
            (global as any).Notification = { permission: 'denied' };
            expect(pushService.hasPushPermission()).toBe(false);
            (global as any).Notification = orig;
        });
    });

    describe('isPushDenied', () => {
        it('returns true when localStorage pushDenied is "true"', () => {
            localStorage.setItem('pushDenied', 'true');
            expect(pushService.isPushDenied()).toBe(true);
        });

        it('returns false when pushDenied is not set', () => {
            expect(pushService.isPushDenied()).toBe(false);
        });
    });

    describe('registerPushSubscription', () => {
        it('returns false when serviceWorker is not in navigator', async () => {
            const orig = (global as any).navigator;
            (global as any).navigator = {};
            const result = await pushService.registerPushSubscription();
            expect(result).toBe(false);
            expect(localStorage.getItem('pushDenied')).toBe('true');
            (global as any).navigator = orig;
        });

        it('returns false when PushManager is not in window', async () => {
            const origNav = (global as any).navigator;
            const origWin = (global as any).window;
            (global as any).navigator = { serviceWorker: {} };
            (global as any).window = {};
            const result = await pushService.registerPushSubscription();
            expect(result).toBe(false);
            (global as any).navigator = origNav;
            (global as any).window = origWin;
        });

        it('returns false when Notification.requestPermission is not granted', async () => {
            const origNav = (global as any).navigator;
            const origWin = (global as any).window;
            (global as any).navigator = {
                serviceWorker: {
                    register: vi.fn().mockResolvedValue({ pushManager: { getSubscription: vi.fn().mockResolvedValue(null), subscribe: vi.fn() } }),
                    ready: Promise.resolve(),
                },
            };
            (global as any).window = { PushManager: {} };
            (global as any).Notification = { requestPermission: vi.fn().mockResolvedValue('denied') };
            const result = await pushService.registerPushSubscription();
            expect(result).toBe(false);
            expect(localStorage.getItem('pushDenied')).toBe('true');
            (global as any).navigator = origNav;
            (global as any).window = origWin;
        });

        it('returns true and calls api.post when permission granted and subscribe succeeds', async () => {
            const mockSubscription = {};
            const reg = {
                pushManager: {
                    getSubscription: vi.fn().mockResolvedValue(null),
                    subscribe: vi.fn().mockResolvedValue(mockSubscription),
                },
            };
            const atobPolyfill = (s: string) => Buffer.from(s, 'base64').toString('binary');
            (global as any).navigator = {
                serviceWorker: {
                    register: vi.fn().mockResolvedValue(reg),
                    ready: Promise.resolve(),
                },
            };
            (global as any).window = { PushManager: {}, atob: atobPolyfill };
            (global as any).Notification = { requestPermission: vi.fn().mockResolvedValue('granted') };
            vi.mocked(api.post).mockResolvedValueOnce({});

            const result = await pushService.registerPushSubscription();

            expect(result).toBe(true);
            expect(api.post).toHaveBeenCalledWith('/push/subscribe', { subscription: mockSubscription });
            expect(localStorage.getItem('pushDenied')).toBeNull();
        });
    });
});
