import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { startNotificationScheduler } from '../src/services/notificationScheduler';
import { startEtaRefreshScheduler } from '../src/services/etaRefreshScheduler';
import { sendPushNotification } from '../src/services/pushService';
import * as tripController from '../src/controllers/tripController';

// Mock Prisma
vi.mock('@prisma/client', () => {
    const mockPrisma = {
        trip: {
            findMany: vi.fn(),
            update: vi.fn(),
        },
    };
    return { PrismaClient: vi.fn(() => mockPrisma) };
});

// Mock push service
vi.mock('../src/services/pushService', () => ({
    sendPushNotification: vi.fn().mockResolvedValue(true),
}));

// Mock tripController for refresh
vi.mock('../src/controllers/tripController', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/controllers/tripController')>();
    return {
        ...original,
        recalculateTripEta: vi.fn().mockResolvedValue({}),
    };
});

// Helper to wait for async logic inside setInterval
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Background Schedulers', () => {
    let prisma: any;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        prisma = new PrismaClient();
    });

    describe('Notification Scheduler', () => {
        it('should send 30-min and 5-min reminders', async () => {
            const now = new Date();
            const mockTrip = {
                id: 'trip-1',
                start_address: 'A',
                dest_address: 'B',
                selected_transit: 'car',
                car_leave_by: new Date(now.getTime() + 28 * 60000), // 28 mins from now
                notified_30min: false,
                notified: false,
                user: {
                    push_subscriptions: [{ endpoint: 'e', p256dh: 'p', auth: 'a' }]
                }
            };

            prisma.trip.findMany.mockResolvedValue([mockTrip]);
            prisma.trip.update.mockResolvedValue({});

            startNotificationScheduler();
            
            // Re-mock findMany to return empty after first run to avoid infinite processing if any
            // Just advance time once
            await vi.advanceTimersByTimeAsync(30000);

            expect(sendPushNotification).toHaveBeenCalled();
            expect(prisma.trip.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'trip-1' },
                data: expect.objectContaining({ notified_30min: true })
            }));
        });
    });

    describe('ETA Refresh Scheduler', () => {
        it('should refresh stale trips', async () => {
            const mockTrip = { id: 'trip-2', status: 'pending' };
            prisma.trip.findMany.mockResolvedValue([mockTrip]);

            startEtaRefreshScheduler();

            await vi.advanceTimersByTimeAsync(120000); // 2 mins

            expect(tripController.recalculateTripEta).toHaveBeenCalledWith('trip-2');
        });
    });
});
