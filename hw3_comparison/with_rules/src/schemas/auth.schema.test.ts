import { describe, it, expect } from 'vitest';
import { loginSchema, signUpSchema } from './auth.schema';

// TDD: auth.schema tests — written before implementation per rules §4
describe('loginSchema', () => {
    it('accepts valid email and password', () => {
        const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret' });
        expect(result.success).toBe(true);
    });

    it('rejects missing email', () => {
        const result = loginSchema.safeParse({ email: '', password: 'secret' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Email is required');
    });

    it('rejects invalid email format', () => {
        const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Enter a valid email address');
    });

    it('rejects missing password', () => {
        const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Password is required');
    });
});

describe('signUpSchema', () => {
    const valid = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Secure@123',
        confirmPassword: 'Secure@123',
        agreeTerms: true as const,
    };

    it('accepts a valid sign-up payload', () => {
        expect(signUpSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects password shorter than 8 characters', () => {
        const result = signUpSchema.safeParse({ ...valid, password: 'Ab@1', confirmPassword: 'Ab@1' });
        expect(result.success).toBe(false);
        const msgs = result.error?.issues.map((i) => i.message) ?? [];
        expect(msgs.some((m) => m.includes('8 characters'))).toBe(true);
    });

    it('rejects password without uppercase letter', () => {
        const result = signUpSchema.safeParse({ ...valid, password: 'secure@123', confirmPassword: 'secure@123' });
        expect(result.success).toBe(false);
        const msgs = result.error?.issues.map((i) => i.message) ?? [];
        expect(msgs.some((m) => m.includes('uppercase'))).toBe(true);
    });

    it('rejects mismatched confirmPassword', () => {
        const result = signUpSchema.safeParse({ ...valid, confirmPassword: 'WrongPass@1' });
        expect(result.success).toBe(false);
        const msgs = result.error?.issues.map((i) => i.message) ?? [];
        expect(msgs.some((m) => m.includes('Passwords do not match'))).toBe(true);
    });

    it('rejects when agreeTerms is not checked', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = signUpSchema.safeParse({ ...valid, agreeTerms: false as any });
        expect(result.success).toBe(false);
        const msgs = result.error?.issues.map((i) => i.message) ?? [];
        expect(msgs.some((m) => m.includes('Terms of Service'))).toBe(true);
    });

    it('rejects empty fullName', () => {
        const result = signUpSchema.safeParse({ ...valid, fullName: '' });
        expect(result.success).toBe(false);
        const msgs = result.error?.issues.map((i) => i.message) ?? [];
        expect(msgs.some((m) => m.includes('Full name is required'))).toBe(true);
    });
});
