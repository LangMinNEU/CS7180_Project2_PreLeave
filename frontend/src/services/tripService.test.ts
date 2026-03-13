import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import * as tripService from './tripService';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
        put: vi.fn(),
    },
}));

describe('tripService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should get trips', async () => {
        const mockData = { success: true, data: { upcoming: [], history: [] } };
        (api.get as any).mockResolvedValue({ data: mockData });

        const result = await tripService.getTrips();
        expect(result).toEqual(mockData);
        expect(api.get).toHaveBeenCalledWith('/trips');
    });

    it('should create a trip', async () => {
        const payload = { startAddress: 'A', destAddress: 'B', arrivalTime: 'T' };
        const mockData = { success: true, data: { id: '1' } };
        (api.post as any).mockResolvedValue({ data: mockData });

        const result = await tripService.createTrip(payload as any);
        expect(result).toEqual(mockData);
        expect(api.post).toHaveBeenCalledWith('/trips', payload);
    });

    it('should handle API errors', async () => {
        (api.get as any).mockRejectedValue({
            response: { data: { error: 'Failed' } }
        });

        // The service should catch and return consistent format or rethrow
        // Based on implementation, let's see:
        // export const getTrips = async () => {
        //     const response = await api.get('/trips');
        //     return response.data;
        // };
        // It doesnt catch, so we expect it to throw.
        
        await expect(tripService.getTrips()).rejects.toBeDefined();
    });
});
