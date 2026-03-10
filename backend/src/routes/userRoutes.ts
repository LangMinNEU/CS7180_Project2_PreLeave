import { Router } from 'express';
import { getProfile, setupPush } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// In a real app, this would be protected by an auth middleware.
// For now, we'll just implement the mock endpoint to fulfill the PRD's frontend requirements.
router.get('/profile', getProfile);

// Endpoint to store web push subscription
router.post('/setup-push', authMiddleware, setupPush);

export default router;
