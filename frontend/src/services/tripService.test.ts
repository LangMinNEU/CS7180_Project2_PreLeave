import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as tripService from './tripService';
import api from './api';

vi.mock('./api');

describe('tripService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getTrips', () => {
        it('returns upcoming and history from api', async () => {
            const data = {
                success: true,
                data: {
                    upcoming: [{ id: '1', startAddress: 'A', destAddress: 'B', requiredArrivalTime: '', reminderLeadMinutes: 60, status: 'pending', userId: 'u1', createdAt: '' }],
                    history: [],
                },
            };
            vi.mocked(api.get).mockResolvedValueOnce({ data });

            const result = await tripService.getTrips();

            expect(api.get).toHaveBeenCalledWith('/trips');
            expect(result).toEqual(data);
        });

        it('returns error response when api fails', async () => {
            vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

            await expect(tripService.getTrips()).rejects.toThrow('Network error');
        });
    });

    describe('getTrip', () => {
        it('returns single trip by id', async () => {
            const data = { success: true, data: { id: 't1', startAddress: 'A', destAddress: 'B', requiredArrivalTime: '', reminderLeadMinutes: 60, status: 'pending', userId: 'u1', createdAt: '' } };
            vi.mocked(api.get).mockResolvedValueOnce({ data });

            const result = await tripService.getTrip('t1');

            expect(api.get).toHaveBeenCalledWith('/trips/t1');
            expect(result).toEqual(data);
        });
    });

    describe('previewTripService', () => {
        it('posts to /trips/preview and returns response', async () => {
            const payload = { startAddress: 'A', destAddress: 'B', arrivalTime: '2026-06-01T12:00:00Z', reminderLeadMinutes: 60 };
            const data = { success: true, data: { id: 'preview', startAddress: 'A', destAddress: 'B', requiredArrivalTime: '', reminderLeadMinutes: 60, status: 'pending', userId: '', createdAt: '' } };
            vi.mocked(api.post).mockResolvedValueOnce({ data });

            const result = await tripService.previewTripService(payload);

            expect(api.post).toHaveBeenCalledWith('/trips/preview', payload);
            expect(result).toEqual(data);
        });
    });

    describe('createTrip', () => {
        it('posts to /trips and returns created trip', async () => {
            const payload = { startAddress: 'A', destAddress: 'B', arrivalTime: '2026-06-01T12:00:00Z', reminderLeadMinutes: 60 };
            const data = { success: true, data: { id: 'new', startAddress: 'A', destAddress: 'B', requiredArrivalTime: '', reminderLeadMinutes: 60, status: 'pending', userId: 'u1', createdAt: '' } };
            vi.mocked(api.post).mockResolvedValueOnce({ data });

            const result = await tripService.createTrip(payload);

            expect(api.post).toHaveBeenCalledWith('/trips', payload);
            expect(result).toEqual(data);
        });
    });

    describe('deleteTrip', () => {
        it('calls delete and returns response', async () => {
            const data = { success: true };
            vi.mocked(api.delete).mockResolvedValueOnce({ data });

            const result = await tripService.deleteTrip('t1');

            expect(api.delete).toHaveBeenCalledWith('/trips/t1');
            expect(result).toEqual(data);
        });
    });

    describe('refreshEta', () => {
        it('posts to refresh-eta and returns response', async () => {
            const data = { success: true, data: { id: 't1', busEtaMinutes: 25 } };
            vi.mocked(api.post).mockResolvedValueOnce({ data });

            const result = await tripService.refreshEta('t1');

            expect(api.post).toHaveBeenCalledWith('/trips/t1/refresh-eta');
            expect(result).toEqual(data);
        });
    });

    describe('completeTrip', () => {
        it('patches to complete and returns response', async () => {
            const data = { success: true, data: { id: 't1', status: 'completed' } };
            vi.mocked(api.patch).mockResolvedValueOnce({ data });

            const result = await tripService.completeTrip('t1');

            expect(api.patch).toHaveBeenCalledWith('/trips/t1/complete');
            expect(result).toEqual(data);
        });
    });
});
