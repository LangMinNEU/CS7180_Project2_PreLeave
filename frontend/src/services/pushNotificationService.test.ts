import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerPushSubscription } from './pushNotificationService';
import api from './api';

vi.mock('./api', () => ({
    default: {
        post: vi.fn(),
    },
}));

describe('pushNotificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock Notification API
        (global as any).Notification = {
            requestPermission: vi.fn().mockResolvedValue('granted'),
            permission: 'default',
        };

        // Mock PushManager
        (global as any).PushManager = {};

        // Mock navigator.serviceWorker
        const mockRegistration = {
            pushManager: {
                subscribe: vi.fn().mockResolvedValue({
                    toJSON: () => ({ endpoint: 'e', keys: { p256dh: 'p', auth: 'a' } })
                }),
                getSubscription: vi.fn().mockResolvedValue(null),
            },
            register: vi.fn().mockResolvedValue({}),
        };

        Object.defineProperty(global.navigator, 'serviceWorker', {
            configurable: true,
            value: {
                ready: Promise.resolve(mockRegistration),
                register: vi.fn().mockResolvedValue(mockRegistration),
            },
        });

        // Mock VITE_VAPID_PUBLIC_KEY
        vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BNC_fake_vapid_key');
        
        // Mock window.atob
        (global as any).atob = vi.fn((str) => Buffer.from(str, 'base64').toString('binary'));
    });

    it('should register push subscription successfully', async () => {
        (api.post as any).mockResolvedValue({ data: { success: true } });

        const result = await registerPushSubscription();
        
        expect(result).toBe(true);
        expect(api.post).toHaveBeenCalledWith('/push/subscribe', expect.any(Object));
    });

    it('should return false if serviceWorker is not supported', async () => {
        Object.defineProperty(global.navigator, 'serviceWorker', {
            configurable: true,
            value: undefined,
        });

        const result = await registerPushSubscription();
        expect(result).toBe(false);
    });
});
