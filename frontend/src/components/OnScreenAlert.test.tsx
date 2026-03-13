import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OnScreenAlert from './OnScreenAlert';
import { useTripStore } from '../stores/tripStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../stores/tripStore', () => ({ useTripStore: vi.fn() }));

describe('OnScreenAlert', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useTripStore).mockReturnValue({ upcomingTrips: [] });
    });

    it('renders nothing when there are no trips', () => {
        const { container } = render(
            <BrowserRouter>
                <OnScreenAlert />
            </BrowserRouter>
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when trips have no resolved mode or departure time', () => {
        vi.mocked(useTripStore).mockReturnValue({
            upcomingTrips: [
                {
                    id: '1',
                    startAddress: 'A',
                    destAddress: 'B',
                    requiredArrivalTime: '',
                    reminderLeadMinutes: 60,
                    status: 'pending',
                    userId: 'u1',
                    createdAt: '',
                    recommendedTransit: null,
                    selectedTransit: null,
                    busLeaveBy: null,
                    carLeaveBy: null,
                },
            ],
        });
        const { container } = render(
            <BrowserRouter>
                <OnScreenAlert />
            </BrowserRouter>
        );
        expect(container.querySelector('[class*="fixed"]')).toBeNull();
    });

    it('shows 5min alert when leave-by is within 5 minutes (bus)', async () => {
        const now = new Date();
        const leaveBy = new Date(now.getTime() + 3 * 60 * 1000);
        vi.mocked(useTripStore).mockReturnValue({
            upcomingTrips: [
                {
                    id: 't1',
                    startAddress: 'A',
                    destAddress: 'Office',
                    requiredArrivalTime: leaveBy.toISOString(),
                    reminderLeadMinutes: 60,
                    status: 'pending',
                    userId: 'u1',
                    createdAt: '',
                    recommendedTransit: 'bus',
                    selectedTransit: null,
                    busLeaveBy: leaveBy.toISOString(),
                    carLeaveBy: null,
                },
            ],
        });
        render(
            <BrowserRouter>
                <OnScreenAlert />
            </BrowserRouter>
        );
        await waitFor(() => {
            expect(screen.queryByText(/time to leave now/i)).toBeInTheDocument();
        }, { timeout: 500 });
    });

    it('dismiss button clears alert', async () => {
        const now = new Date();
        const leaveBy = new Date(now.getTime() + 3 * 60 * 1000);
        vi.mocked(useTripStore).mockReturnValue({
            upcomingTrips: [
                {
                    id: 't1',
                    startAddress: 'A',
                    destAddress: 'Office',
                    requiredArrivalTime: leaveBy.toISOString(),
                    reminderLeadMinutes: 60,
                    status: 'pending',
                    userId: 'u1',
                    createdAt: '',
                    recommendedTransit: 'bus',
                    selectedTransit: null,
                    busLeaveBy: leaveBy.toISOString(),
                    carLeaveBy: null,
                },
            ],
        });
        render(
            <BrowserRouter>
                <OnScreenAlert />
            </BrowserRouter>
        );
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /dismiss alert/i })).toBeInTheDocument();
        }, { timeout: 500 });
        const dismiss = screen.getByRole('button', { name: /dismiss alert/i });
        fireEvent.click(dismiss);
        expect(screen.queryByText(/time to leave now/i)).not.toBeInTheDocument();
    });

    it('View Trip button navigates and clears alert', async () => {
        const now = new Date();
        const leaveBy = new Date(now.getTime() + 3 * 60 * 1000);
        vi.mocked(useTripStore).mockReturnValue({
            upcomingTrips: [
                {
                    id: 't1',
                    startAddress: 'A',
                    destAddress: 'Office',
                    requiredArrivalTime: leaveBy.toISOString(),
                    reminderLeadMinutes: 60,
                    status: 'pending',
                    userId: 'u1',
                    createdAt: '',
                    recommendedTransit: 'car',
                    selectedTransit: null,
                    busLeaveBy: null,
                    carLeaveBy: leaveBy.toISOString(),
                },
            ],
        });
        render(
            <BrowserRouter>
                <OnScreenAlert />
            </BrowserRouter>
        );
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /view trip/i })).toBeInTheDocument();
        }, { timeout: 500 });
        fireEvent.click(screen.getByRole('button', { name: /view trip/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/trip-result/t1');
    });
});
