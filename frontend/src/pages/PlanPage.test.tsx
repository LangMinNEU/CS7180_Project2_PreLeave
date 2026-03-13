import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import PlanPage from './PlanPage';

const { mockUseTripStore, mockCreatePreview } = vi.hoisted(() => {
    const addTrip = vi.fn();
    const createPreview = vi.fn();
    return {
        mockAddTrip: addTrip,
        mockCreatePreview: createPreview,
        mockUseTripStore: Object.assign(
            (selector: any) => selector({ addTrip, createPreview }),
            { getState: () => ({ error: null }) }
        ),
    };
});

// Mock the Zustand store
vi.mock('../stores/tripStore', () => ({
    useTripStore: mockUseTripStore,
}));

// Mock Router navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Since we check if time is in the future, we need to mock a future date for testing
const getFutureDateStrings = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
        date: tomorrow.toISOString().slice(0, 10),
        time: tomorrow.toISOString().slice(11, 16)
    };
};

describe('PlanPage Component', () => {
    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <PlanPage />
            </BrowserRouter>
        );
    };

    it('renders the plan trip form successfully', () => {
        renderComponent();
        expect(screen.getByRole('heading', { name: /plan a new trip/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/start address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/destination address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/required arrival date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/required arrival time/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /plan trip/i })).toBeInTheDocument();
    });

    it('displays validation errors on empty submission', async () => {
        renderComponent();

        const submitButton = screen.getByRole('button', { name: /plan trip/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getAllByText(/please enter a complete address/i)).toHaveLength(2);
        });
    });

    it('displays validation error for past dates', async () => {
        renderComponent();

        fireEvent.change(screen.getByLabelText(/start address/i), { target: { value: 'Home Address' } });
        fireEvent.change(screen.getByLabelText(/destination address/i), { target: { value: 'Work Address' } });

        // Use a past date
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);
        fireEvent.change(screen.getByLabelText(/required arrival date/i), {
            target: { value: pastDate.toISOString().slice(0, 10) }
        });
        fireEvent.change(screen.getByLabelText(/required arrival time/i), {
            target: { value: '12:00' }
        });

        const submitButton = screen.getByRole('button', { name: /plan trip/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getAllByText(/arrival time must be in the future/i)).toHaveLength(2);
        });
    });

    it('calls navigate on cancel', () => {
        renderComponent();
        const cancelBtn = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/homepage');
    });

    it('submits valid form data and navigates to trip-result/preview on success', async () => {
        const mockPreview = { id: 'preview', startAddress: '123 Main St', destAddress: '456 Work Ave', requiredArrivalTime: '', reminderLeadMinutes: 60, status: 'pending', userId: '', createdAt: '' };
        mockCreatePreview.mockResolvedValue({ success: true, data: mockPreview });

        renderComponent();

        fireEvent.change(screen.getByLabelText(/start address/i), { target: { value: '123 Main St' } });
        fireEvent.change(screen.getByLabelText(/destination address/i), { target: { value: '456 Work Ave' } });

        const { date, time } = getFutureDateStrings();
        fireEvent.change(screen.getByLabelText(/required arrival date/i), {
            target: { value: date },
        });
        fireEvent.change(screen.getByLabelText(/required arrival time/i), {
            target: { value: time },
        });

        const submitButton = screen.getByRole('button', { name: /plan trip/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockCreatePreview).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/trip-result/preview', { state: { preview: mockPreview } });
        });
    });

    it('displays form error when createPreview fails', async () => {
        mockCreatePreview.mockResolvedValue({ success: false, error: 'No route found' });

        renderComponent();
        fireEvent.change(screen.getByLabelText(/start address/i), { target: { value: '123 Main St' } });
        fireEvent.change(screen.getByLabelText(/destination address/i), { target: { value: '456 Work Ave' } });
        const { date, time } = getFutureDateStrings();
        fireEvent.change(screen.getByLabelText(/required arrival date/i), { target: { value: date } });
        fireEvent.change(screen.getByLabelText(/required arrival time/i), { target: { value: time } });

        fireEvent.click(screen.getByRole('button', { name: /plan trip/i }));

        await waitFor(() => {
            expect(screen.getByText(/no route found/i)).toBeInTheDocument();
        });
    });

    it('displays form error when createPreview throws', async () => {
        mockCreatePreview.mockRejectedValueOnce(new Error('Network error'));
        renderComponent();
        fireEvent.change(screen.getByLabelText(/start address/i), { target: { value: '123 Main St' } });
        fireEvent.change(screen.getByLabelText(/destination address/i), { target: { value: '456 Work Ave' } });
        const { date, time } = getFutureDateStrings();
        fireEvent.change(screen.getByLabelText(/required arrival date/i), { target: { value: date } });
        fireEvent.change(screen.getByLabelText(/required arrival time/i), { target: { value: time } });

        fireEvent.click(screen.getByRole('button', { name: /plan trip/i }));

        await waitFor(() => {
            expect(screen.getByText(/network error|unexpected error/i)).toBeInTheDocument();
        });
    });
});
