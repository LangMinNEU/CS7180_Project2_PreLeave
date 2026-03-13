import { describe, it, expect, vi } from 'vitest';
import { getProfile } from '../src/controllers/userController';
import { Request, Response } from 'express';

describe('userController', () => {
    describe('getProfile', () => {
        it('responds with success, username, email, and trips array', () => {
            const req = {} as Request;
            const res = {
                json: vi.fn(),
            } as unknown as Response;

            getProfile(req, res);

            expect(res.json).toHaveBeenCalledTimes(1);
            const body = vi.mocked(res.json).mock.calls[0][0];
            expect(body).toEqual({
                success: true,
                data: {
                    username: 'NiceguyLang',
                    email: 'niceguy@example.com',
                    trips: [
                        {
                            id: '1',
                            startAddress: '123 Main St',
                            destAddress: '456 Market St',
                            arrivalTime: '2026-03-08T10:00:00Z',
                            recommendedTransit: 'bus',
                        },
                        {
                            id: '2',
                            startAddress: '789 Oak Ave',
                            destAddress: '321 Pine Rd',
                            arrivalTime: '2026-03-09T14:30:00Z',
                            recommendedTransit: 'uber',
                        },
                    ],
                },
            });
        });
    });
});
