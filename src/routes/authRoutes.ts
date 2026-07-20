import { Router } from 'express';
import { register, login, google, demo, refresh, logout, getMe, updateProfile } from '../controllers/authController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', google);
router.post('/demo', demo);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', optionalAuth, getMe);
router.put('/profile', authenticate, updateProfile);

export default router;
