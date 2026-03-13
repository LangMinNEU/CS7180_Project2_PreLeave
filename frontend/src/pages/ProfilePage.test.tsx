import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from './ProfilePage';
import { useAuthStore } from '../stores/authStore';
import { useTripStore } from '../stores/tripStore';
import api from '../services/api';

// Mock constraints
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../stores/authStore', () => ({
    useAuthStore: Object.assign(vi.fn(), {
        getState: () => ({
            user: { email: 'test@example.com' },
            clearUser: vi.fn(),
        }),
    }),
}));

vi.mock('../stores/tripStore', () => ({
    useTripStore: vi.fn(),
}));

vi.mock('../services/api', () => ({
    default: {
        post: vi.fn().mockResolvedValue({}),
    },
}));

describe('ProfilePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <ProfilePage />
            </BrowserRouter>
        );
    };

    it('renders profile and trip history', () => {
        vi.mocked(useAuthStore).mockImplementation((selector: any) => selector({
            user: { email: 'test@example.com' },
            clearUser: vi.fn(),
        }));

        vi.mocked(useTripStore).mockReturnValue({
            historyTrips: [{ id: '1', startAddress: 'Oakland', destAddress: 'Berkeley', requiredArrivalTime: new Date().toISOString() }],
            fetchTrips: vi.fn(),
            deleteTrip: vi.fn(),
            isLoading: false
        });

        renderComponent();

        expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
        expect(screen.getByText(/Oakland/)).toBeInTheDocument();
        expect(screen.getByText(/Berkeley/)).toBeInTheDocument();
    });

    it('handles logout', async () => {
        const clearUser = vi.fn();
        vi.mocked(useAuthStore).mockImplementation(((selector: any) => selector({ user: { email: 'e' }, clearUser })) as any);
        (useAuthStore as any).getState = () => ({ clearUser });

        vi.mocked(useTripStore).mockReturnValue({ historyTrips: [], fetchTrips: vi.fn(), deleteTrip: vi.fn(), isLoading: false });

        renderComponent();

        fireEvent.click(screen.getByLabelText(/Logout/i));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/auth/logout');
            expect(clearUser).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    it('handles reuse trip', () => {
        vi.mocked(useTripStore).mockReturnValue({
            historyTrips: [{ id: '1', startAddress: 'Home', destAddress: 'Work', requiredArrivalTime: '2023-01-01T12:00:00Z' }],
            fetchTrips: vi.fn(),
            deleteTrip: vi.fn(),
            isLoading: false
        });

        renderComponent();

        fireEvent.click(screen.getByLabelText(/Reuse/i));

        expect(mockNavigate).toHaveBeenCalledWith('/trips/new', expect.objectContaining({
            state: expect.objectContaining({ startAddress: 'Home' })
        }));
    });
});
