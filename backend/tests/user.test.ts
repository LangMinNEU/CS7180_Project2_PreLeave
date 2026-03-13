import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('App', () => {
    describe('GET /health', () => {
        it('returns 200 and status ok', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true, data: { status: 'ok' } });
        });
    });
});

describe('User Endpoints', () => {
    describe('GET /users/profile', () => {
        it('returns the profile for the logged in user', async () => {
            const response = await request(app).get('/users/profile');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('username', 'NiceguyLang');
            expect(response.body.data).toHaveProperty('trips');
            expect(Array.isArray(response.body.data.trips)).toBe(true);
            expect(response.body.data.trips.length).toBeGreaterThan(0);
        });

        it('returns profile with PRD response shape (success, data, trips with required fields)', async () => {
            const response = await request(app).get('/users/profile');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    username: 'NiceguyLang',
                    email: 'niceguy@example.com',
                },
            });
            const trips = response.body.data.trips;
            expect(trips.length).toBe(2);
            expect(trips[0]).toMatchObject({
                id: '1',
                startAddress: '123 Main St',
                destAddress: '456 Market St',
                arrivalTime: '2026-03-08T10:00:00Z',
                recommendedTransit: 'bus',
            });
            expect(trips[1]).toHaveProperty('recommendedTransit', 'uber');
        });
    });
});
