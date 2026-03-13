import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
    it('renders and shows login route at /', () => {
        window.history.pushState({}, '', '/');
        render(<App />);
        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    });

    it('renders login page at /login', () => {
        window.history.pushState({}, '', '/login');
        render(<App />);
        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    });
});
