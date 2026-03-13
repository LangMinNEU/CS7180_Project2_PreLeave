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
            const win = globalThis as any;
            const orig = win.Notification;
            win.Notification = { permission: 'granted' };
            expect(pushService.hasPushPermission()).toBe(true);
            win.Notification = orig;
        });

        it('returns false when Notification.permission is not granted', () => {
            const win = globalThis as any;
            const orig = win.Notification;
            win.Notification = { permission: 'denied' };
            expect(pushService.hasPushPermission()).toBe(false);
            win.Notification = orig;
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
            const g = globalThis as any;
            const orig = g.navigator;
            g.navigator = {};
            const result = await pushService.registerPushSubscription();
            expect(result).toBe(false);
            expect(localStorage.getItem('pushDenied')).toBe('true');
            g.navigator = orig;
        });

        it('returns false when PushManager is not in window', async () => {
            const g = globalThis as any;
            const origNav = g.navigator;
            const origWin = g.window;
            g.navigator = { serviceWorker: {} };
            g.window = {};
            const result = await pushService.registerPushSubscription();
            expect(result).toBe(false);
            g.navigator = origNav;
            g.window = origWin;
        });

        it('returns false when Notification.requestPermission is not granted', async () => {
            const g = globalThis as any;
            const origNav = g.navigator;
            const origWin = g.window;
            g.navigator = {
                serviceWorker: {
                    register: vi.fn().mockResolvedValue({ pushManager: { getSubscription: vi.fn().mockResolvedValue(null), subscribe: vi.fn() } }),
                    ready: Promise.resolve(),
                },
            };
            g.window = { PushManager: {} };
            g.Notification = { requestPermission: vi.fn().mockResolvedValue('denied') };
            const result = await pushService.registerPushSubscription();
            expect(result).toBe(false);
            expect(localStorage.getItem('pushDenied')).toBe('true');
            g.navigator = origNav;
            g.window = origWin;
        });

        it('returns true and calls api.post when permission granted and subscribe succeeds', async () => {
            const mockSubscription = {};
            const reg = {
                pushManager: {
                    getSubscription: vi.fn().mockResolvedValue(null),
                    subscribe: vi.fn().mockResolvedValue(mockSubscription),
                },
            };
            function base64ToBinary(base64: string): string {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                const padding = '='.repeat((4 - (base64.length % 4)) % 4);
                const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
                const bytes: number[] = [];
                for (let i = 0; i < b64.length; i += 4) {
                    const a = chars.indexOf(b64[i]);
                    const b = chars.indexOf(b64[i + 1]);
                    const c = chars.indexOf(b64[i + 2]);
                    const d = chars.indexOf(b64[i + 3]);
                    if (a < 0 || b < 0) break;
                    bytes.push((a << 2) | (b >> 4));
                    if (c >= 0) bytes.push(((b << 4) & 0xf0) | (c >> 2));
                    if (d >= 0) bytes.push(((c << 6) & 0xc0) | d);
                }
                return String.fromCharCode(...bytes);
            }
            const g = globalThis as any;
            g.navigator = {
                serviceWorker: {
                    register: vi.fn().mockResolvedValue(reg),
                    ready: Promise.resolve(),
                },
            };
            g.window = { PushManager: {}, atob: base64ToBinary };
            g.Notification = { requestPermission: vi.fn().mockResolvedValue('granted') };
            vi.mocked(api.post).mockResolvedValueOnce({});

            const result = await pushService.registerPushSubscription();

            expect(result).toBe(true);
            expect(api.post).toHaveBeenCalledWith('/push/subscribe', { subscription: mockSubscription });
            expect(localStorage.getItem('pushDenied')).toBeNull();
        });
    });
});
