import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTripStore } from './tripStore';
import * as tripService from '../services/tripService';

vi.mock('../services/tripService', () => ({
    getTrips: vi.fn(),
    getTrip: vi.fn(),
    createTrip: vi.fn(),
    previewTripService: vi.fn(),
    deleteTrip: vi.fn(),
    refreshEta: vi.fn(),
    completeTrip: vi.fn(),
}));

describe('tripStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset store manually if needed, but Zustand stores persist
        useTripStore.setState({
            upcomingTrips: [],
            historyTrips: [],
            currentTrip: null,
            previewTrip: null,
            isLoading: false,
            error: null,
        });
    });

    it('should fetch trips and update state', async () => {
        const mockData = {
            success: true,
            data: {
                upcoming: [{ id: 't1', startAddress: 'A' }],
                history: [{ id: 't2', startAddress: 'B' }]
            }
        };
        (tripService.getTrips as any).mockResolvedValue(mockData);

        await useTripStore.getState().fetchTrips();

        expect(useTripStore.getState().upcomingTrips).toHaveLength(1);
        expect(useTripStore.getState().historyTrips).toHaveLength(1);
        expect(useTripStore.getState().isLoading).toBe(false);
    });

    it('should handle fetch trips error', async () => {
        (tripService.getTrips as any).mockRejectedValue({
            response: { data: { error: 'Server Error' } }
        });

        await useTripStore.getState().fetchTrips();

        expect(useTripStore.getState().error).toBe('Server Error');
        expect(useTripStore.getState().isLoading).toBe(false);
    });

    it('should create a preview', async () => {
        const mockPreview = { id: 'p1', startAddress: 'A', destAddress: 'B' };
        (tripService.previewTripService as any).mockResolvedValue({
            success: true,
            data: mockPreview
        });

        const result = await useTripStore.getState().createPreview({
            startAddress: 'A',
            destAddress: 'B',
            arrivalTime: new Date().toISOString()
        });

        expect(result.success).toBe(true);
        expect(useTripStore.getState().previewTrip).toEqual(mockPreview);
    });

    it('should handle optimistic update for completeTrip', async () => {
        const trip = { id: 't1', status: 'pending' as const, startAddress: 'A', createdAt: 'now' } as any;
        useTripStore.setState({ upcomingTrips: [trip], historyTrips: [] });
        
        (tripService.completeTrip as any).mockResolvedValue({ success: true });

        const promise = useTripStore.getState().completeTrip('t1');
        
        // Check optimistic state
        expect(useTripStore.getState().upcomingTrips).toHaveLength(0);
        expect(useTripStore.getState().historyTrips).toHaveLength(1);
        expect(useTripStore.getState().historyTrips[0].status).toBe('completed');

        await promise;
    });

    it('should revert optimistic update on failure', async () => {
        const trip = { id: 't1', status: 'pending' as const, startAddress: 'A', createdAt: 'now' } as any;
        useTripStore.setState({ upcomingTrips: [trip], historyTrips: [] });
        
        (tripService.completeTrip as any).mockResolvedValue({ success: false, error: 'Failed' });

        await useTripStore.getState().completeTrip('t1');

        expect(useTripStore.getState().upcomingTrips).toHaveLength(1);
        expect(useTripStore.getState().historyTrips).toHaveLength(0);
        expect(useTripStore.getState().error).toBe('Failed');
    });
});
