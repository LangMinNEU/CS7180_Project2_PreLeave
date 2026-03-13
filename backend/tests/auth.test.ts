import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

vi.mock('@prisma/client', () => {
    const mockPrisma = {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    };
    return {
        PrismaClient: vi.fn(() => mockPrisma),
        Prisma: {
            PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
                code = 'P2002';
                constructor(message: string, opts?: { code?: string }) {
                    super(message);
                    if (opts?.code) this.code = opts.code;
                }
            },
        },
    };
});

vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn(),
        compare: vi.fn(),
    },
}));

vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn((payload: any, secret: string, opts: any) => `mock-token-${payload.userId}`),
    },
}));

import authRoutes from '../src/routes/authRoutes';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth routes', () => {
    let prisma: any;

    beforeEach(() => {
        vi.clearAllMocks();
        prisma = new PrismaClient();
    });

    describe('POST /auth/register', () => {
        it('returns 201 and tokens when registration succeeds', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({
                id: 'user-1',
                email: 'new@example.com',
                password_hash: 'hashed',
            });
            vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);

            const response = await request(app)
                .post('/auth/register')
                .send({ email: 'new@example.com', password: 'password123' });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toEqual({ id: 'user-1', email: 'new@example.com' });
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.headers['set-cookie']).toBeDefined();
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'new@example.com' } });
            expect(prisma.user.create).toHaveBeenCalled();
        });

        it('returns 409 when user already exists', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'existing@example.com' });

            const response = await request(app)
                .post('/auth/register')
                .send({ email: 'existing@example.com', password: 'password123' });

            expect(response.status).toBe(409);
            expect(response.body).toEqual({ success: false, error: 'User already exists' });
            expect(prisma.user.create).not.toHaveBeenCalled();
        });

        it('returns 400 on validation failure (invalid email)', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({ email: 'not-an-email', password: 'password123' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
            expect(prisma.user.findUnique).not.toHaveBeenCalled();
        });

        it('returns 400 on validation failure (password too short)', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({ email: 'valid@example.com', password: 'short' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
        });

        it('returns 409 when create throws Prisma P2002 (unique constraint)', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            const { Prisma } = await import('@prisma/client');
            const p2002 = new (Prisma as any).PrismaClientKnownRequestError('Unique constraint', { code: 'P2002' });
            prisma.user.create.mockRejectedValue(p2002);
            vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);

            const response = await request(app)
                .post('/auth/register')
                .send({ email: 'new@example.com', password: 'password123' });

            expect(response.status).toBe(409);
            expect(response.body).toEqual({ success: false, error: 'User already exists' });
        });

        it('returns 500 when create throws other Prisma error', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            const { Prisma } = await import('@prisma/client');
            const other = new (Prisma as any).PrismaClientKnownRequestError('Other', { code: 'P2003' });
            prisma.user.create.mockRejectedValue(other);
            vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);

            const response = await request(app)
                .post('/auth/register')
                .send({ email: 'new@example.com', password: 'password123' });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ success: false, error: 'Database error' });
        });

        it('returns 500 when create throws generic error', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockRejectedValue(new Error('Unexpected'));
            vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);

            const response = await request(app)
                .post('/auth/register')
                .send({ email: 'new@example.com', password: 'password123' });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ success: false, error: 'Internal server error' });
        });
    });

    describe('POST /auth/login', () => {
        it('returns 200 and tokens when credentials are valid', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                email: 'user@example.com',
                password_hash: 'hashed',
            });
            vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'user@example.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toEqual({ id: 'user-1', email: 'user@example.com' });
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.headers['set-cookie']).toBeDefined();
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed');
        });

        it('returns 401 with generic message when user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'password123' });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ success: false, error: 'Invalid credentials' });
        });

        it('returns 401 with generic message when password is wrong', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                email: 'user@example.com',
                password_hash: 'hashed',
            });
            vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'user@example.com', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ success: false, error: 'Invalid credentials' });
        });

        it('returns 400 on validation failure', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'invalid', password: 'password123' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
        });

        it('returns 500 when findUnique throws', async () => {
            prisma.user.findUnique.mockRejectedValue(new Error('DB error'));

            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'user@example.com', password: 'password123' });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ success: false, error: 'Internal server error' });
        });
    });

    describe('POST /auth/logout', () => {
        it('returns 200 and clears cookie', async () => {
            const response = await request(app)
                .post('/auth/logout');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true, data: { message: 'Logged out successfully' } });
            expect(response.headers['set-cookie']).toBeDefined();
        });
    });
});
