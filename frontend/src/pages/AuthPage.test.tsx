import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import AuthPage from './AuthPage.tsx';

describe('AuthPage Component', () => {
    const renderAuthPage = () => {
        return render(
            <BrowserRouter>
                <AuthPage />
            </BrowserRouter>
        );
    };

    it('should render the login form by default', () => {
        renderAuthPage();
        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
    });

    it('should toggle between login and signup', () => {
        renderAuthPage();

        // Switch to Sign Up
        const toggleLink = screen.getByRole('button', { name: /sign up/i });
        fireEvent.click(toggleLink);

        expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();

        // Switch back to Login
        const loginLink = screen.getByRole('button', { name: /login/i });
        fireEvent.click(loginLink);

        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    });

    it('should display validation errors for empty submissions', async () => {
        renderAuthPage();

        const submitBtn = screen.getByRole('button', { name: /login/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Invalid email address')).toBeInTheDocument();
            expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
        });
    });

    it('should display generic error message on invalid credentials', async () => {
        renderAuthPage();

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitBtn = screen.getByRole('button', { name: /login/i });

        fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

        // Since we mock backend, we simulate the form submit and check for generic error
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });
});
