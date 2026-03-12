import { Router } from 'express';
import { createTrip, previewTrip, getTrips, getTripById, deleteTrip, refreshEta } from '../controllers/tripController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protect all trip routes with authentication
router.use(authMiddleware);

router.post('/preview', previewTrip); // must be before /:id routes
router.post('/', createTrip);
router.get('/', getTrips);
router.get('/:id', getTripById);
router.post('/:id/refresh-eta', refreshEta);
router.delete('/:id', deleteTrip);

export default router;
