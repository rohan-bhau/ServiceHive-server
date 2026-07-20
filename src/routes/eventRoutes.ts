import { Router } from 'express';
import { trackView, trackSave } from '../controllers/eventController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/view', trackView);
router.post('/save', trackSave);

export default router;
