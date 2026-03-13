import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as tripService from '../services/tripService';
import { useTripStore } from './tripStore';

vi.mock('../services/tripService');

const mockTrip = {
    id: 't1',
    userId: 'u1',
    startAddress: 'A',
    destAddress: 'B',
    requiredArrivalTime: '2026-06-01T12:00:00Z',
    reminderLeadMinutes: 60,
    status: 'pending' as const,
    createdAt: '2026-01-01T00:00:00Z',
};

describe('tripStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useTripStore.setState({
            upcomingTrips: [],
            historyTrips: [],
            currentTrip: null,
            previewTrip: null,
            isLoading: false,
            error: null,
        });
    });

    describe('fetchTrips', () => {
        it('sets upcoming and history on success', async () => {
            vi.mocked(tripService.getTrips).mockResolvedValueOnce({
                success: true,
                data: { upcoming: [mockTrip], history: [] },
            });

            await useTripStore.getState().fetchTrips();

            expect(useTripStore.getState().upcomingTrips).toEqual([mockTrip]);
            expect(useTripStore.getState().historyTrips).toEqual([]);
            expect(useTripStore.getState().isLoading).toBe(false);
            expect(useTripStore.getState().error).toBeNull();
        });

        it('sets error when response success is false', async () => {
            vi.mocked(tripService.getTrips).mockResolvedValueOnce({
                success: false,
                error: 'Failed to fetch',
            });

            await useTripStore.getState().fetchTrips();

            expect(useTripStore.getState().error).toBe('Failed to fetch');
            expect(useTripStore.getState().isLoading).toBe(false);
        });

        it('sets error and returns on catch', async () => {
            vi.mocked(tripService.getTrips).mockRejectedValueOnce({ response: { data: { error: 'Network' }, status: 500 } });

            const result = await useTripStore.getState().fetchTrips();

            expect(useTripStore.getState().error).toBe('Network');
            expect(result).toEqual({ success: false, status: 500 });
        });
    });

    describe('fetchTrip', () => {
        it('sets currentTrip on success', async () => {
            vi.mocked(tripService.getTrip).mockResolvedValueOnce({ success: true, data: mockTrip });

            await useTripStore.getState().fetchTrip('t1');

            expect(useTripStore.getState().currentTrip).toEqual(mockTrip);
            expect(useTripStore.getState().isLoading).toBe(false);
        });

        it('sets error when success is false', async () => {
            vi.mocked(tripService.getTrip).mockResolvedValueOnce({ success: false, error: 'Not found' });

            await useTripStore.getState().fetchTrip('t1');

            expect(useTripStore.getState().error).toBe('Not found');
        });
    });

    describe('createPreview', () => {
        it('returns success and sets previewTrip when api succeeds', async () => {
            vi.mocked(tripService.previewTripService).mockResolvedValueOnce({ success: true, data: mockTrip });

            const result = await useTripStore.getState().createPreview({
                startAddress: 'A',
                destAddress: 'B',
                arrivalTime: '2026-06-01T12:00:00Z',
            });

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTrip);
            expect(useTripStore.getState().previewTrip).toEqual(mockTrip);
        });

        it('returns failure when already loading', async () => {
            useTripStore.setState({ isLoading: true });
            const result = await useTripStore.getState().createPreview({
                startAddress: 'A',
                destAddress: 'B',
                arrivalTime: '2026-06-01T12:00:00Z',
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('Already loading');
            expect(tripService.previewTripService).not.toHaveBeenCalled();
        });

        it('returns failure and sets error on api error', async () => {
            vi.mocked(tripService.previewTripService).mockRejectedValueOnce({ response: { data: { error: 'Preview failed' } } });

            const result = await useTripStore.getState().createPreview({
                startAddress: 'A',
                destAddress: 'B',
                arrivalTime: '2026-06-01T12:00:00Z',
            });

            expect(result.success).toBe(false);
            expect(useTripStore.getState().error).toBe('Preview failed');
        });
    });

    describe('addTrip', () => {
        it('returns failure when already loading', async () => {
            useTripStore.setState({ isLoading: true });
            const result = await useTripStore.getState().addTrip({
                startAddress: 'A',
                destAddress: 'B',
                arrivalTime: '2026-06-01T12:00:00Z',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('already being created');
            expect(tripService.createTrip).not.toHaveBeenCalled();
        });

        it('sets currentTrip and fetches trips on success', async () => {
            vi.mocked(tripService.createTrip).mockResolvedValueOnce({ success: true, data: mockTrip });
            vi.mocked(tripService.getTrips).mockResolvedValueOnce({
                success: true,
                data: { upcoming: [mockTrip], history: [] },
            });

            const result = await useTripStore.getState().addTrip({
                startAddress: 'A',
                destAddress: 'B',
                arrivalTime: '2026-06-01T12:00:00Z',
            });

            expect(result.success).toBe(true);
            expect(useTripStore.getState().currentTrip).toEqual(mockTrip);
            expect(tripService.getTrips).toHaveBeenCalled();
        });
    });

    describe('deleteTrip', () => {
        it('calls fetchTrips after successful delete', async () => {
            vi.mocked(tripService.deleteTrip).mockResolvedValueOnce({ success: true });
            vi.mocked(tripService.getTrips).mockResolvedValueOnce({
                success: true,
                data: { upcoming: [], history: [] },
            });

            await useTripStore.getState().deleteTrip('t1');

            expect(tripService.deleteTrip).toHaveBeenCalledWith('t1');
            expect(tripService.getTrips).toHaveBeenCalled();
        });

        it('sets error when delete fails', async () => {
            vi.mocked(tripService.deleteTrip).mockResolvedValueOnce({ success: false, error: 'Forbidden' });

            await useTripStore.getState().deleteTrip('t1');

            expect(useTripStore.getState().error).toBe('Forbidden');
        });
    });

    describe('refreshEta', () => {
        it('updates currentTrip and upcomingTrips when id matches', async () => {
            const updated = { ...mockTrip, busEtaMinutes: 30 };
            useTripStore.setState({ currentTrip: mockTrip, upcomingTrips: [mockTrip] });
            vi.mocked(tripService.refreshEta).mockResolvedValueOnce({ success: true, data: updated });

            await useTripStore.getState().refreshEta('t1');

            expect(useTripStore.getState().currentTrip).toEqual(updated);
            expect(useTripStore.getState().upcomingTrips[0]).toEqual(updated);
        });
    });

    describe('completeTrip', () => {
        it('moves trip to history optimistically and keeps it on api success', async () => {
            useTripStore.setState({ upcomingTrips: [mockTrip], historyTrips: [] });
            vi.mocked(tripService.completeTrip).mockResolvedValueOnce({ success: true });

            await useTripStore.getState().completeTrip('t1');

            expect(useTripStore.getState().upcomingTrips).toHaveLength(0);
            expect(useTripStore.getState().historyTrips).toHaveLength(1);
            expect(useTripStore.getState().historyTrips[0].status).toBe('completed');
        });

        it('reverts on api failure', async () => {
            useTripStore.setState({ upcomingTrips: [mockTrip], historyTrips: [] });
            vi.mocked(tripService.completeTrip).mockResolvedValueOnce({ success: false, error: 'Failed' });

            await useTripStore.getState().completeTrip('t1');

            expect(useTripStore.getState().upcomingTrips).toHaveLength(1);
            expect(useTripStore.getState().historyTrips).toHaveLength(0);
            expect(useTripStore.getState().error).toBeDefined();
        });

        it('does nothing when trip not in upcomingTrips', async () => {
            useTripStore.setState({ upcomingTrips: [], historyTrips: [] });

            await useTripStore.getState().completeTrip('t1');

            expect(tripService.completeTrip).not.toHaveBeenCalled();
        });
    });
});
