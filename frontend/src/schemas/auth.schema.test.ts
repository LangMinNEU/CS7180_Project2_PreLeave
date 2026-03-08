import { describe, it, expect } from 'vitest';
import { authSchema } from './auth.schema';

describe('Auth Schema Validation', () => {
    it('should validate a correct email and password', () => {
        const result = authSchema.safeParse({ email: 'test@example.com', password: 'password123' });
        expect(result.success).toBe(true);
    });

    it('should invalidate an incorrect email', () => {
        const result = authSchema.safeParse({ email: 'invalid-email', password: 'password123' });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Invalid email address');
        }
    });

    it('should invalidate a short password', () => {
        const result = authSchema.safeParse({ email: 'test@example.com', password: '123' });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
        }
    });
});
