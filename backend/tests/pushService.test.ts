import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('web-push', () => ({
    default: {
        setVapidDetails: vi.fn(),
        sendNotification: vi.fn(),
    },
}));

// Set VAPID env before loading pushService so pushEnabled is true
process.env.VAPID_PUBLIC_KEY = 'test-public-key';
process.env.VAPID_PRIVATE_KEY = 'test-private-key';

import { sendPushNotification } from '../src/services/pushService';
import webpush from 'web-push';

describe('pushService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(webpush.sendNotification).mockResolvedValue({ statusCode: 201 } as any);
    });

    it('returns true when sendNotification succeeds', async () => {
        const subscription = { endpoint: 'https://e.com', keys: { p256dh: 'p', auth: 'a' } };
        const payload = { title: 'Test', body: 'Body' };

        const result = await sendPushNotification(subscription, payload);

        expect(result).toBe(true);
        expect(webpush.sendNotification).toHaveBeenCalledWith(
            subscription,
            JSON.stringify(payload),
            expect.objectContaining({ TTL: 240 })
        );
    });

    it('accepts custom ttl', async () => {
        const subscription = { endpoint: 'https://e.com', keys: { p256dh: 'p', auth: 'a' } };
        await sendPushNotification(subscription, { title: 'T' }, 360);

        expect(webpush.sendNotification).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(String),
            expect.objectContaining({ TTL: 360 })
        );
    });

    it('returns false when sendNotification throws', async () => {
        vi.mocked(webpush.sendNotification).mockRejectedValueOnce(new Error('Push failed'));

        const subscription = { endpoint: 'https://e.com', keys: { p256dh: 'p', auth: 'a' } };
        const result = await sendPushNotification(subscription, { title: 'T' });

        expect(result).toBe(false);
    });
});
