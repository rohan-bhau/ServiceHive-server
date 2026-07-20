import { Router } from 'express';
import { getServiceReviews, createReview } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', getServiceReviews);
router.post('/', authenticate, createReview);

export default router;
