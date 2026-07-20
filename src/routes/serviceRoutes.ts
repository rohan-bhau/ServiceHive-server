import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  relatedServices,
} from '../controllers/serviceController';
import reviewRoutes from './reviewRoutes';

const router = Router();

router.use('/:id/reviews', reviewRoutes);

router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/', authenticate, createService);
router.put('/:id', authenticate, updateService);
router.delete('/:id', authenticate, deleteService);
router.get('/:id/related', relatedServices);

export default router;

