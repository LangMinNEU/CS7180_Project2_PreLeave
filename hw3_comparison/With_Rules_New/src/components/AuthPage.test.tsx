import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthPage } from './AuthPage';
import { describe, it, expect } from 'vitest';

describe('AuthPage', () => {
    it('renders login form by default', () => {
        render(<AuthPage />);
        expect(screen.getByRole('heading', { name: /log in to your account/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
    });

    it('toggles to sign up mode', () => {
        render(<AuthPage />);
        const toggleButton = screen.getByText(/don't have an account\? sign up/i);
        fireEvent.click(toggleButton);

        expect(screen.getByRole('heading', { name: /create a new account/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    });

    it('shows validation errors when submitting empty form', async () => {
        render(<AuthPage />);
        const submitButton = screen.getByRole('button', { name: 'Log in' });

        fireEvent.click(submitButton);

        expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
        expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    it('allows user to type into inputs', async () => {
        const user = userEvent.setup();
        render(<AuthPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');

        expect(emailInput).toHaveValue('test@example.com');
        expect(passwordInput).toHaveValue('password123');
    });
});
