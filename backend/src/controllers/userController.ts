import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient(); export const getProfile = async (req: Request, res: Response) => {
    // Mocked out response since we don't have a DB connection / complete auth setup yet
    // but we want to fulfill the PRD format: { success, data, error }
    res.json({
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
                }
            ]
        }
    });
};

export const setupPush = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const { subscription } = req.body;

        if (!userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }

        if (!subscription) {
            res.status(400).json({ success: false, error: 'Subscription data required' });
            return;
        }

        await prisma.user.update({
            where: { id: userId },
            data: { push_subscription: subscription }
        });

        res.status(200).json({ success: true, data: { message: 'Push subscription saved' } });
    } catch (error) {
        console.error('Setup push error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
