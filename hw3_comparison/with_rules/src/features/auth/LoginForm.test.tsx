import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../features/auth/LoginForm';

// Reset zustand store between tests
vi.mock('../../features/auth/auth.store', () => ({
    useAuthStore: vi.fn((selector: (s: { setAuth: () => void }) => unknown) =>
        selector({ setAuth: vi.fn() }),
    ),
}));

describe('LoginForm', () => {
    it('renders email and password fields with accessible labels', () => {
        render(<LoginForm />);
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('renders the Log In submit button', () => {
        render(<LoginForm />);
        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('shows email required error on empty submit', async () => {
        const user = userEvent.setup();
        render(<LoginForm />);
        await user.click(screen.getByRole('button', { name: /log in/i }));
        expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    });

    it('shows invalid email error for bad format', async () => {
        const user = userEvent.setup();
        render(<LoginForm />);
        await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
        await user.click(screen.getByRole('button', { name: /log in/i }));
        expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
    });

    it('shows password required error when password is empty', async () => {
        const user = userEvent.setup();
        render(<LoginForm />);
        await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
        await user.click(screen.getByRole('button', { name: /log in/i }));
        expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    });

    it('calls onSuccess after valid submission', async () => {
        const user = userEvent.setup();
        const onSuccess = vi.fn();
        render(<LoginForm onSuccess={onSuccess} />);

        await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
        await user.type(screen.getByLabelText(/password/i), 'anypassword');
        await user.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce(), { timeout: 3000 });
    });
});
