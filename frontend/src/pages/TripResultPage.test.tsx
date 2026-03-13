import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TripResultPage from './TripResultPage';
import { useTripStore } from '../stores/tripStore';

// Mock the store
vi.mock('../stores/tripStore', () => ({
    useTripStore: vi.fn(),
}));

vi.mock('../services/pushNotificationService', () => ({
    registerPushSubscription: vi.fn(),
    hasPushPermission: vi.fn().mockReturnValue(false),
    isPushDenied: vi.fn().mockReturnValue(false),
}));

// Mock react-router-dom
const mockedUseNavigate = vi.fn();
const mockedUseParams = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        useNavigate: () => mockedUseNavigate,
        useParams: () => mockedUseParams(),
    };
});

describe('TripResultPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseParams.mockReturnValue({ id: 'trip-123' });
        // Mock window.confirm
        window.confirm = vi.fn().mockReturnValue(true);
        // Mock navigate for testing
        mockedUseNavigate.mockReset();
    });

    const createMockTrip = (overrides = {}) => {
        const mockDate = new Date();
        mockDate.setDate(mockDate.getDate() + 1);
        mockDate.setHours(17, 30, 0, 0);
        return {
            id: 'trip-123',
            startAddress: '937 Helen Ave, San Leandro, CA',
            destAddress: '5000 MacArthur Blvd, Oakland, CA',
            requiredArrivalTime: mockDate.toISOString(),
            recommendedTransit: 'car',
            busEtaMinutes: 45,
            carEtaMinutes: 20,
            bufferMinutes: 5,
            busLeaveBy: new Date(mockDate.getTime() - 45 * 60000 - 5 * 60000).toISOString(),
            carLeaveBy: new Date(mockDate.getTime() - 20 * 60000 - 5 * 60000).toISOString(),
            departureTime: new Date(mockDate.getTime() - 20 * 60000 - 5 * 60000).toISOString(),
            ...overrides,
        };
    };

    const mockStoreWith = (overrides = {}) => {
        (useTripStore as any).mockReturnValue({
            currentTrip: null,
            fetchTrip: vi.fn(),
            addTrip: vi.fn(),
            isLoading: false,
            error: null,
            ...overrides,
        });
        // Also mock the selector form used for addTrip
        (useTripStore as any).mockImplementation((selector?: any) => {
            const state = {
                currentTrip: null,
                fetchTrip: vi.fn(),
                addTrip: vi.fn(),
                isLoading: false,
                error: null,
                ...overrides,
            };
            return selector ? selector(state) : state;
        });
    };

    it('renders loading state initially', () => {
        mockStoreWith({ isLoading: true });

        render(<BrowserRouter><TripResultPage /></BrowserRouter>);
        expect(screen.getByText('Loading Trip Details...')).toBeInTheDocument();
    });

    it('renders error state when trip fetch fails', () => {
        mockStoreWith({ error: 'Failed to fetch trip details' });

        render(<BrowserRouter><TripResultPage /></BrowserRouter>);
        expect(screen.getByText('Trip Not Found')).toBeInTheDocument();
        expect(screen.getByText('Failed to fetch trip details')).toBeInTheDocument();
    });

    it('renders trip details and shows recommended transit buffer text', () => {
        const mockTrip = createMockTrip();
        mockStoreWith({ currentTrip: mockTrip });

        render(<BrowserRouter><TripResultPage /></BrowserRouter>);

        expect(screen.getByText('937 Helen Ave, San Leandro, CA')).toBeInTheDocument();
        expect(screen.getByText('5000 MacArthur Blvd, Oakland, CA')).toBeInTheDocument();
        expect(screen.getByText('45 min')).toBeInTheDocument();
        expect(screen.getByText('20 min')).toBeInTheDocument();

        // recommendedTransit is 'car', so buffer text should say 'driving'
        expect(screen.getByText('(Includes a 5 min buffer for driving)')).toBeInTheDocument();
        expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('shows bus buffer text when recommendedTransit is bus', () => {
        const mockTrip = createMockTrip({ recommendedTransit: 'bus' });
        mockStoreWith({ currentTrip: mockTrip });

        render(<BrowserRouter><TripResultPage /></BrowserRouter>);

        expect(screen.getByText('(Includes a 5 min buffer for public transit)')).toBeInTheDocument();
    });

    it('auto-selects Car and shows Bus as unavailable when busEtaMinutes is null', () => {
        const mockTrip = createMockTrip({
            busEtaMinutes: null,
            busLeaveBy: null,
            recommendedTransit: 'car',
        });
        mockStoreWith({ currentTrip: mockTrip });

        render(<BrowserRouter><TripResultPage /></BrowserRouter>);

        expect(screen.getByText('Bus path unavailable')).toBeInTheDocument();
    });

    it('successfully saves a trip and navigates', async () => {
        const mockTrip = createMockTrip();
        const mockAddTrip = vi.fn().mockResolvedValue({ success: true });

        (useTripStore as any).mockReturnValue({
            currentTrip: mockTrip,
            fetchTrip: vi.fn(),
            addTrip: mockAddTrip,
            isLoading: false,
            error: null,
        });

        render(<BrowserRouter><TripResultPage /></BrowserRouter>);
        
        const saveButton = screen.getByText('Save Trip');
        fireEvent.click(saveButton);

        // Click "Yes, Save" in the confirmation modal
        const confirmButton = screen.getByText('Yes, Save');
        fireEvent.click(confirmButton);
    it('opens confirmation dialog when Save Trip is clicked', () => {
        const mockTrip = createMockTrip();
        mockStoreWith({ currentTrip: mockTrip });

        render(<BrowserRouter><TripResultPage /></BrowserRouter>);

        fireEvent.click(screen.getByText('Save Trip'));

        expect(screen.getByText('Save this trip?')).toBeInTheDocument();
        expect(screen.getByText('Yes, Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('navigates to /homepage after confirming save', async () => {
        const mockAddTrip = vi.fn().mockResolvedValue({ success: true });
        const mockTrip = createMockTrip();

        // id is not 'preview', so addTrip won't be called — just push/notification flow runs
        // We mock window.confirm to skip the push notification prompt
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        mockStoreWith({ currentTrip: mockTrip, addTrip: mockAddTrip });

        render(<BrowserRouter><TripResultPage /></BrowserRouter>);

        fireEvent.click(screen.getByText('Save Trip'));
        fireEvent.click(screen.getByText('Yes, Save'));

        await waitFor(() => {
            expect(mockedUseNavigate).toHaveBeenCalledWith('/homepage');
        });

        vi.restoreAllMocks();
    });

    it('closes dialog and does not navigate when Cancel is clicked', () => {
        const mockTrip = createMockTrip();
        mockStoreWith({ currentTrip: mockTrip });

        render(<BrowserRouter><TripResultPage /></BrowserRouter>);

        fireEvent.click(screen.getByText('Save Trip'));
        expect(screen.getByText('Save this trip?')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Cancel'));

        expect(screen.queryByText('Save this trip?')).not.toBeInTheDocument();
        expect(mockedUseNavigate).not.toHaveBeenCalled();
    });

    it('navigates to new trip page when Plan Another is clicked', () => {
        const mockTrip = createMockTrip();
        mockStoreWith({ currentTrip: mockTrip });

        render(<BrowserRouter><TripResultPage /></BrowserRouter>);

        fireEvent.click(screen.getByText('Plan Another Trip'));

        expect(mockedUseNavigate).toHaveBeenCalledWith('/trips/new');
    });
});
