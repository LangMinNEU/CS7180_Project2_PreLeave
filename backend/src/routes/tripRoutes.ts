import { Router } from 'express';
import { createTrip, getTrips } from '../controllers/tripController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protect all trip routes with authentication
router.use(authMiddleware);

router.post('/', createTrip);
router.get('/', getTrips);

export default router;
