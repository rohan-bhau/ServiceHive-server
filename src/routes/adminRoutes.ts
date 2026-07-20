import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminAuth';
import {
  getAdminStats, getUsers, updateUserRole, deleteUser,
  getPendingServices, approveService, deleteService,
} from '../controllers/adminController';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/services/pending', getPendingServices);
router.patch('/services/:id/approve', approveService);
router.delete('/services/:id', deleteService);

export default router;
