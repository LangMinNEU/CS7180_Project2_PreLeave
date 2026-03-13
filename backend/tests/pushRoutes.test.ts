import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import pushRoutes from '../src/routes/pushRoutes';
import * as autocompleteController from '../src/controllers/autocompleteController';

// Mock Prisma
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

// Mock auth middleware
vi.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.userId = 'u1';
        next();
    },
}));

// Mock push service
vi.mock('../src/services/pushService', () => ({
    sendPushNotification: vi.fn().mockResolvedValue(true),
}));

// Mock fetch for autocomplete
global.fetch = vi.fn();

describe('Push Routes & Autocomplete', () => {
    let app: Express;
    let prisma: any;

    beforeEach(() => {
        vi.clearAllMocks();
        prisma = new PrismaClient();
        app = express();
        app.use(express.json());
        
        app.use('/api/push', pushRoutes);
        app.get('/api/autocomplete', autocompleteController.getSuggestions);
    });

    describe('POST /api/push/subscribe', () => {
        it('should create a subscription', async () => {
            prisma.pushSubscription.create.mockResolvedValue({});
            const response = await request(app)
                .post('/api/push/subscribe')
                .send({
                    subscription: {
                        endpoint: 'https://example.com',
                        keys: { p256dh: 'd', auth: 'a' }
                    }
                });
            expect(response.status).toBe(201);
            expect(prisma.pushSubscription.create).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/push/unsubscribe', () => {
        it('should unsubscribe successfully', async () => {
            prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 });
            const response = await request(app)
                .delete('/api/push/unsubscribe')
                .send({ endpoint: 'https://example.com' });
            expect(response.status).toBe(200);
            expect(prisma.pushSubscription.deleteMany).toHaveBeenCalled();
        });
    });

    describe('POST /api/push/test', () => {
        it('should send a test notification', async () => {
            prisma.pushSubscription.findMany.mockResolvedValue([{ endpoint: 'e', p256dh: 'p', auth: 'a' }]);
            const response = await request(app).post('/api/push/test');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Test notification sent');
        });

        it('should return 404 if no subscriptions', async () => {
            prisma.pushSubscription.findMany.mockResolvedValue([]);
            const response = await request(app).post('/api/push/test');
            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/autocomplete', () => {
        it('should return suggestions from HERE API', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({
                    items: [{ address: { label: 'Home' } }]
                })
            });

            const response = await request(app).get('/api/autocomplete?q=oakland');
            expect(response.status).toBe(200);
            expect(response.body.data[0].label).toBe('Home');
        });

        it('should return empty array for short queries', async () => {
            const response = await request(app).get('/api/autocomplete?q=o');
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(0);
        });
    });
});
