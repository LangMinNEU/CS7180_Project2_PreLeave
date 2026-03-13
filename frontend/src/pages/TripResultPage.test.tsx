import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TripResultPage from './TripResultPage';
import { useTripStore } from '../stores/tripStore';

// Mock store
vi.mock('../stores/tripStore', () => ({
    useTripStore: Object.assign(vi.fn(), {
        getState: () => ({
            refreshEta: vi.fn().mockResolvedValue({}),
            addTrip: vi.fn().mockResolvedValue({ success: true }),
        }),
        setState: vi.fn(),
    }),
}));

// Mock push service
vi.mock('../services/pushNotificationService', () => ({
    registerPushSubscription: vi.fn().mockResolvedValue(true),
    hasPushPermission: vi.fn().mockReturnValue(false),
    isPushDenied: vi.fn().mockReturnValue(false),
}));

describe('TripResultPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithState = (id: string, state: any) => {
        return render(
            <MemoryRouter initialEntries={[{ pathname: `/trip-result/${id}`, state }]}>
                <Routes>
                    <Route path="/trip-result/:id" element={<TripResultPage />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders trip details from location state', () => {
        const mockTrip = {
            id: '123',
            startAddress: 'Start Point',
            destAddress: 'End Point',
            requiredArrivalTime: new Date().toISOString(),
            busEtaMinutes: 15,
            carEtaMinutes: 10,
            recommendedTransit: 'car',
        };

        vi.mocked(useTripStore).mockReturnValue({
            currentTrip: mockTrip,
            fetchTrip: vi.fn(),
            isLoading: false,
            error: null,
            addTrip: vi.fn()
        } as any);

        renderWithState('123', { trip: mockTrip });

        expect(screen.getByText('Start Point')).toBeInTheDocument();
        expect(screen.getByText('End Point')).toBeInTheDocument();
        expect(screen.getByText(/10 min/)).toBeInTheDocument();
    });

    it('handles save trip with confirmation', async () => {
        const mockTrip = { id: '123', startAddress: 'A', destAddress: 'B', requiredArrivalTime: new Date().toISOString() };
        vi.mocked(useTripStore).mockReturnValue({
            currentTrip: mockTrip,
            fetchTrip: vi.fn(),
            isLoading: false,
            error: null,
            addTrip: vi.fn().mockResolvedValue({ success: true })
        } as any);

        renderWithState('123', { trip: mockTrip });

        fireEvent.click(screen.getByText(/Save Trip/i));
        
        expect(screen.getByText(/Save this trip\?/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Yes, Save/i));

        // Navigation check would need a real navigate mock but MemoryRouter handles it
    });
});
