import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { authMiddleware, AuthRequest } from '../src/middleware/authMiddleware';

vi.mock('jsonwebtoken', () => ({
    default: {
        verify: vi.fn(),
    },
}));

import jwt from 'jsonwebtoken';

describe('authMiddleware', () => {
    let app: Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = express();
        app.use(express.json());
        app.get('/protected', authMiddleware, (req: AuthRequest, res) => {
            res.status(200).json({ userId: req.userId });
        });
    });

    it('returns 401 when Authorization header is missing', async () => {
        const response = await request(app)
            .get('/protected');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ success: false, error: 'Unauthorized: No token provided' });
        expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header does not start with Bearer ', async () => {
        const response = await request(app)
            .get('/protected')
            .set('Authorization', 'Basic abc123');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ success: false, error: 'Unauthorized: No token provided' });
        expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization is Bearer but token value is missing or empty', async () => {
        const response = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer ');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(['Unauthorized: No token provided', 'Unauthorized: Invalid token format']).toContain(response.body.error);
        expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('returns 401 when token is invalid or expired', async () => {
        vi.mocked(jwt.verify).mockImplementation(() => {
            throw new Error('invalid token');
        });

        const response = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ success: false, error: 'Unauthorized: Invalid token' });
        expect(jwt.verify).toHaveBeenCalledWith('invalid-token', expect.any(String));
    });

    it('sets req.userId and calls next when token is valid', async () => {
        vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any);

        const response = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer valid-token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ userId: 'user-123' });
        expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
    });

    it('returns 401 with Invalid token format when Bearer is followed by empty string', () => {
        const req = {
            headers: { authorization: 'Bearer  ' },
        } as AuthRequest;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as import('express').Response;
        const next = vi.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized: Invalid token format' });
        expect(next).not.toHaveBeenCalled();
        expect(jwt.verify).not.toHaveBeenCalled();
    });
});
