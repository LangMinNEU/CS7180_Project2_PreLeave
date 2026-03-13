import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => {
    const mockPrisma = {
        pushSubscription: {
            create: vi.fn(),
            deleteMany: vi.fn(),
            findMany: vi.fn(),
        },
    };
    return { PrismaClient: vi.fn(() => mockPrisma) };
});

vi.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.userId = 'test-user-id';
        next();
    },
}));

vi.mock('../src/services/pushService', () => ({
    sendPushNotification: vi.fn().mockResolvedValue(true),
}));

import pushRoutes from '../src/routes/pushRoutes';

const app = express();
app.use(express.json());
app.use('/push', pushRoutes);

describe('Push routes', () => {
    let prisma: any;

    beforeEach(() => {
        vi.clearAllMocks();
        prisma = new PrismaClient();
    });

    const validSubscription = {
        subscription: {
            endpoint: 'https://push.example.com/endpoint',
            keys: {
                p256dh: 'p256dh-key',
                auth: 'auth-key',
            },
        },
    };

    describe('POST /push/subscribe', () => {
        it('returns 201 when subscription is valid', async () => {
            prisma.pushSubscription.create.mockResolvedValue({});

            const response = await request(app)
                .post('/push/subscribe')
                .send(validSubscription);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ success: true, data: { message: 'Subscribed successfully' } });
            expect(prisma.pushSubscription.create).toHaveBeenCalledWith({
                data: {
                    userId: 'test-user-id',
                    endpoint: validSubscription.subscription.endpoint,
                    p256dh: validSubscription.subscription.keys.p256dh,
                    auth: validSubscription.subscription.keys.auth,
                },
            });
        });

        it('returns 500 when create fails', async () => {
            prisma.pushSubscription.create.mockRejectedValue(new Error('DB error'));

            const response = await request(app)
                .post('/push/subscribe')
                .send(validSubscription);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ success: false, error: 'Internal server error' });
        });

        it('returns 500 when body validation fails (invalid subscription shape)', async () => {
            const response = await request(app)
                .post('/push/subscribe')
                .send({ subscription: { endpoint: 'x', keys: {} } });

            expect(response.status).toBe(500);
        });
    });

    describe('DELETE /push/unsubscribe', () => {
        it('returns 200 when unsubscribing with endpoint', async () => {
            prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 });

            const response = await request(app)
                .delete('/push/unsubscribe')
                .send({ endpoint: 'https://push.example.com/endpoint' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true, data: { message: 'Unsubscribed successfully' } });
            expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
                where: { userId: 'test-user-id', endpoint: 'https://push.example.com/endpoint' },
            });
        });

        it('returns 200 when unsubscribing without endpoint (all for user)', async () => {
            prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 2 });

            const response = await request(app)
                .delete('/push/unsubscribe')
                .send({});

            expect(response.status).toBe(200);
            expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
                where: { userId: 'test-user-id' },
            });
        });
    });

    describe('POST /push/test', () => {
        it('returns 200 when user has subscriptions', async () => {
            prisma.pushSubscription.findMany.mockResolvedValue([
                { endpoint: 'e1', p256dh: 'p', auth: 'a' },
            ]);

            const response = await request(app).post('/push/test');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Test notification sent');
        });

        it('returns 404 when user has no subscriptions', async () => {
            prisma.pushSubscription.findMany.mockResolvedValue([]);

            const response = await request(app).post('/push/test');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ success: false, error: 'No active subscriptions' });
        });

        it('returns 500 when findMany fails', async () => {
            prisma.pushSubscription.findMany.mockRejectedValue(new Error('DB error'));

            const response = await request(app).post('/push/test');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ success: false, error: 'Internal server error' });
        });
    });
});
