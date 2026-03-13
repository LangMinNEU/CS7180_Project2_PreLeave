import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import * as tripController from '../src/controllers/tripController';

// 1. Mock the Prisma client
vi.mock('@prisma/client', () => {
    const mockPrisma = {
        trip: {
            create: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        },
    };
    return { PrismaClient: vi.fn(() => mockPrisma) };
});

// 2. Mock the middleware
vi.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.userId = 'test-user-id';
        next();
    },
}));

// 3. Mock the here API Service layer directly to avoid fetch parsing logic
vi.mock('../src/services/hereApiService', () => ({
    geocodeAddress: vi.fn().mockResolvedValue({ lat: 10, lng: 10 }),
    getCarEta: vi.fn().mockResolvedValue(20),     // 20 minutes
    getTransitEta: vi.fn().mockResolvedValue(40), // 40 minutes
}));

import { geocodeAddress, getCarEta, getTransitEta } from '../src/services/hereApiService';

describe('Trip Controller Integration', () => {
    let app: Express;
    let prisma: any;

    const setUserId = (req: any, _res: any, next: any) => {
        req.userId = 'test-user-id';
        next();
    };

    beforeEach(() => {
        vi.clearAllMocks();
        prisma = new PrismaClient();

        app = express();
        app.use(express.json());
        app.post('/api/trips', setUserId, tripController.createTrip);
        app.post('/api/trips/preview', setUserId, tripController.previewTrip);
        app.get('/api/trips', setUserId, tripController.getTrips);
        app.get('/api/trips/:id', setUserId, tripController.getTripById);
        app.delete('/api/trips/:id', setUserId, tripController.deleteTrip);
        app.patch('/api/trips/:id/complete', setUserId, tripController.completeTrip);
        app.post('/api/trips/:id/refresh-eta', setUserId, tripController.refreshEta);
    });

    describe('POST /api/trips', () => {
        it('should successfully create a trip with missing coordinates by geocoding', async () => {
            const mockTripCreated = {
                id: 'trip-123',
                user_id: 'test-user-id',
                start_address: 'Start',
                start_lat: 10,
                start_lng: 10,
                dest_address: 'Dest',
                dest_lat: 10,
                dest_lng: 10,
                required_arrival_time: new Date('2030-03-10T12:00:00Z'),
                reminder_lead_minutes: 60,
                status: 'pending',
                recommended_transit: 'car',
                bus_eta_minutes: 40,
                uber_eta_minutes: 20,
                departure_time: new Date('2030-03-10T11:35:00Z'), // 12:00 - 20m - 5m buffer
                created_at: new Date('2030-03-10T11:30:00Z'),
            };

            prisma.trip.create.mockResolvedValue(mockTripCreated);

            const payload = {
                startAddress: 'Start',
                destAddress: 'Dest',
                arrivalTime: '2030-03-10T12:00:00.000Z',
            };

            const response = await request(app)
                .post('/api/trips')
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            // Verify hereApiService was called
            expect(geocodeAddress).toHaveBeenCalledTimes(2);
            expect(getCarEta).toHaveBeenCalledTimes(1);
            expect(getTransitEta).toHaveBeenCalledTimes(1);

            // Verify mapping
            expect(response.body.data.id).toBe('trip-123');
            expect(response.body.data.recommendedTransit).toBe('car');
        });

        it('should handle API validation failures', async () => {
            const response = await request(app)
                .post('/api/trips')
                .send({
                    startAddress: '', // Invalid empty string
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
            expect(geocodeAddress).not.toHaveBeenCalled();
        });

        it('should recover if routing ETA APIs fail to retrieve data', async () => {
            // Mock a scenario where API throws errors
            vi.mocked(getCarEta).mockRejectedValueOnce(new Error('API Down'));
            vi.mocked(getTransitEta).mockRejectedValueOnce(new Error('API Down'));

            const payload = {
                startAddress: 'Start',
                destAddress: 'Dest',
                arrivalTime: '2030-03-10T12:00:00.000Z',
            };

            const response = await request(app)
                .post('/api/trips')
                .send(payload);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('No route found between the two addresses. Please check your addresses and try again.');
            expect(prisma.trip.create).not.toHaveBeenCalled();
        });
    });

    const mockTripRow = (overrides: Record<string, unknown> = {}) => ({
        id: 'trip-123',
        user_id: 'test-user-id',
        start_address: 'Start',
        start_lat: 10,
        start_lng: 10,
        dest_address: 'Dest',
        dest_lat: 10,
        dest_lng: 10,
        required_arrival_time: new Date('2030-03-10T12:00:00Z'),
        reminder_lead_minutes: 60,
        status: 'pending',
        recommended_transit: 'car',
        selected_transit: null,
        bus_eta_minutes: 40,
        uber_eta_minutes: 20,
        bus_leave_by: new Date('2030-03-10T11:15:00Z'),
        car_leave_by: new Date('2030-03-10T11:35:00Z'),
        departure_time: new Date('2030-03-10T11:35:00Z'),
        created_at: new Date('2030-03-10T11:30:00Z'),
        eta_updated_at: null,
        notified: false,
        notified_30min: false,
        ...overrides,
    });

    describe('POST /api/trips/preview', () => {
        it('returns 200 with preview data when payload is valid', async () => {
            const response = await request(app)
                .post('/api/trips/preview')
                .send({
                    startAddress: 'Start',
                    destAddress: 'Dest',
                    arrivalTime: '2030-03-10T12:00:00.000Z',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('recommendedTransit');
            expect(response.body.data).toHaveProperty('busEtaMinutes');
            expect(response.body.data).toHaveProperty('carEtaMinutes');
        });

        it('returns 400 on validation failure', async () => {
            const response = await request(app)
                .post('/api/trips/preview')
                .send({ startAddress: 'Start' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
        });
    });

    describe('GET /api/trips', () => {
        it('returns 200 with upcoming and history', async () => {
            const trip = mockTripRow();
            prisma.trip.findMany.mockResolvedValue([trip]);
            prisma.trip.update.mockResolvedValue(trip);

            const response = await request(app).get('/api/trips');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('upcoming');
            expect(response.body.data).toHaveProperty('history');
            expect(Array.isArray(response.body.data.upcoming)).toBe(true);
            expect(Array.isArray(response.body.data.history)).toBe(true);
            expect(prisma.trip.findMany).toHaveBeenCalledWith({
                where: { user_id: 'test-user-id' },
                orderBy: { required_arrival_time: 'asc' },
            });
        });

        it('returns 401 when userId is missing', async () => {
            const appNoAuth = express();
            appNoAuth.use(express.json());
            appNoAuth.get('/api/trips', tripController.getTrips);

            const response = await request(appNoAuth).get('/api/trips');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ success: false, error: 'Unauthorized' });
        });
    });

    describe('GET /api/trips/:id', () => {
        it('returns 200 and trip when found and owned by user', async () => {
            const trip = mockTripRow();
            prisma.trip.findUnique.mockResolvedValue(trip);

            const response = await request(app).get('/api/trips/trip-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe('trip-123');
            expect(prisma.trip.findUnique).toHaveBeenCalledWith({ where: { id: 'trip-123' } });
        });

        it('returns 404 when trip not found', async () => {
            prisma.trip.findUnique.mockResolvedValue(null);

            const response = await request(app).get('/api/trips/nonexistent');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ success: false, error: 'Trip not found' });
        });

        it('returns 403 when trip belongs to another user', async () => {
            prisma.trip.findUnique.mockResolvedValue(mockTripRow({ user_id: 'other-user' }));

            const response = await request(app).get('/api/trips/trip-123');

            expect(response.status).toBe(403);
            expect(response.body).toEqual({ success: false, error: 'Forbidden' });
        });
    });

    describe('DELETE /api/trips/:id', () => {
        it('returns 200 and deletes when trip exists and owned', async () => {
            const trip = mockTripRow();
            prisma.trip.findUnique.mockResolvedValue(trip);
            prisma.trip.delete.mockResolvedValue(trip);

            const response = await request(app).delete('/api/trips/trip-123');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true, data: { id: 'trip-123' } });
            expect(prisma.trip.delete).toHaveBeenCalledWith({ where: { id: 'trip-123' } });
        });

        it('returns 404 when trip not found', async () => {
            prisma.trip.findUnique.mockResolvedValue(null);

            const response = await request(app).delete('/api/trips/nonexistent');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ success: false, error: 'Trip not found' });
        });

        it('returns 403 when trip belongs to another user', async () => {
            prisma.trip.findUnique.mockResolvedValue(mockTripRow({ user_id: 'other-user' }));

            const response = await request(app).delete('/api/trips/trip-123');

            expect(response.status).toBe(403);
            expect(prisma.trip.delete).not.toHaveBeenCalled();
        });
    });

    describe('PATCH /api/trips/:id/complete', () => {
        it('returns 200 and completed trip when owned', async () => {
            const trip = mockTripRow();
            const updated = { ...trip, status: 'completed' };
            prisma.trip.findUnique.mockResolvedValue(trip);
            prisma.trip.update.mockResolvedValue(updated);

            const response = await request(app).patch('/api/trips/trip-123/complete');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('completed');
            expect(prisma.trip.update).toHaveBeenCalledWith({
                where: { id: 'trip-123' },
                data: { status: 'completed' },
            });
        });

        it('returns 404 when trip not found', async () => {
            prisma.trip.findUnique.mockResolvedValue(null);

            const response = await request(app).patch('/api/trips/nonexistent/complete');

            expect(response.status).toBe(404);
        });

        it('returns 403 when trip belongs to another user', async () => {
            prisma.trip.findUnique.mockResolvedValue(mockTripRow({ user_id: 'other-user' }));

            const response = await request(app).patch('/api/trips/trip-123/complete');

            expect(response.status).toBe(403);
        });
    });

    describe('POST /api/trips/:id/refresh-eta', () => {
        it('returns 200 and updated trip when owned', async () => {
            const trip = mockTripRow();
            const updated = { ...trip, eta_updated_at: new Date() };
            prisma.trip.findUnique.mockResolvedValue(trip);
            prisma.trip.update.mockResolvedValue(updated);

            const response = await request(app).post('/api/trips/trip-123/refresh-eta');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(prisma.trip.findUnique).toHaveBeenCalledWith({ where: { id: 'trip-123' } });
        });

        it('returns 404 when trip not found', async () => {
            prisma.trip.findUnique.mockResolvedValue(null);

            const response = await request(app).post('/api/trips/nonexistent/refresh-eta');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ success: false, error: 'Trip not found' });
        });

        it('returns 404 when trip belongs to another user', async () => {
            prisma.trip.findUnique.mockResolvedValue(mockTripRow({ user_id: 'other-user' }));

            const response = await request(app).post('/api/trips/trip-123/refresh-eta');

            expect(response.status).toBe(404);
        });
    });
});
