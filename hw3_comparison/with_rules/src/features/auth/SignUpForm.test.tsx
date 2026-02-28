import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignUpForm } from '../../features/auth/SignUpForm';

vi.mock('../../features/auth/auth.store', () => ({
    useAuthStore: vi.fn((selector: (s: { setAuth: () => void }) => unknown) =>
        selector({ setAuth: vi.fn() }),
    ),
}));

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Secure@123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Secure@123');
    await user.click(screen.getByRole('checkbox', { name: /terms/i }));
};

describe('SignUpForm', () => {
    it('renders all form fields with accessible labels', () => {
        render(<SignUpForm />);
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders the Create Account submit button', () => {
        render(<SignUpForm />);
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('shows full name required error on empty submit', async () => {
        const user = userEvent.setup();
        render(<SignUpForm />);
        await user.click(screen.getByRole('button', { name: /create account/i }));
        expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    });

    it('shows password min-length error for weak password', async () => {
        const user = userEvent.setup();
        render(<SignUpForm />);
        await user.type(screen.getByLabelText(/^password$/i), 'ab');
        await user.click(screen.getByRole('button', { name: /create account/i }));
        expect(await screen.findByText(/8 characters/i)).toBeInTheDocument();
    });

    it('shows confirm password mismatch error', async () => {
        const user = userEvent.setup();
        render(<SignUpForm />);
        await user.type(screen.getByLabelText(/full name/i), 'Jane');
        await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'Secure@123');
        await user.type(screen.getByLabelText(/confirm password/i), 'Different@1');
        await user.click(screen.getByRole('button', { name: /create account/i }));
        expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('calls onSuccess after valid submission', async () => {
        const user = userEvent.setup();
        const onSuccess = vi.fn();
        render(<SignUpForm onSuccess={onSuccess} />);
        await fillValidForm(user);
        await user.click(screen.getByRole('button', { name: /create account/i }));
        await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce(), { timeout: 3000 });
    });
});
