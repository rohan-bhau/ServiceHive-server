import { Router } from 'express';
import { getStats } from '../controllers/statsController';
import { getTestimonials } from '../controllers/reviewController';

const router = Router();

router.get('/', getStats);
router.get('/testimonials', getTestimonials);

export default router;
