import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import * as authController from '../src/controllers/authController';
import { authMiddleware } from '../src/middleware/authMiddleware';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_development_secret';

// Mock Prisma
vi.mock('@prisma/client', () => {
    const mockPrisma = {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    };
    return { PrismaClient: vi.fn(() => mockPrisma), Prisma: { PrismaClientKnownRequestError: class {} } };
});

describe('Auth Controller & Middleware', () => {
    let app: Express;
    let prisma: any;

    beforeEach(() => {
        vi.clearAllMocks();
        prisma = new PrismaClient();
        app = express();
        app.use(express.json());
        
        app.post('/api/auth/register', authController.register);
        app.post('/api/auth/login', authController.login);
        app.post('/api/auth/logout', authController.logout);
        app.get('/api/auth/me', authMiddleware, (req: any, res) => res.status(200).json({ success: true, userId: req.userId }));
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({ id: 'u1', email: 'test@example.com' });

            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should return 409 if user exists', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(409);
        });

        it('should handle validation errors', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'invalid', password: '1' });
            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const passwordHash = await bcrypt.hash('password123', 10);
            prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'test@example.com', password_hash: passwordHash });

            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.data.accessToken).toBeDefined();
        });

        it('should return 401 for invalid credentials', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'no@example.com', password: 'password' });
            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should clear cookies and return 200', async () => {
            const response = await request(app).post('/api/auth/logout');
            expect(response.status).toBe(200);
            expect(response.headers['set-cookie'][0]).toContain('refreshToken=;');
        });
    });

    describe('Auth Middleware', () => {
        it('should allow access with valid token', async () => {
            const token = jwt.sign({ userId: 'u1' }, JWT_SECRET);
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(response.body.userId).toBe('u1');
        });

        it('should deny access with missing token', async () => {
            const response = await request(app).get('/api/auth/me');
            expect(response.status).toBe(401);
        });

        it('should deny access with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid');
            expect(response.status).toBe(401);
        });
    });
});
