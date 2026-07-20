import { Router } from 'express';
import { generateListing, getRecommendations, chat, getConversations, getConversationById } from '../controllers/aiController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/chat', optionalAuth, chat);
router.post('/generate-listing', authenticate, generateListing);
router.get('/recommendations', authenticate, getRecommendations);
router.get('/conversations', authenticate, getConversations);
router.get('/conversations/:id', authenticate, getConversationById);

export default router;
