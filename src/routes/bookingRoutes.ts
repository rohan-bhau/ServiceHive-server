import { Router } from 'express';
import { createBooking, getMyBookings, updateBookingStatus } from '../controllers/bookingController';
import { getBookingStats } from '../controllers/statsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createBooking);
router.get('/mine', getMyBookings);
router.get('/stats', getBookingStats);
router.patch('/:id', updateBookingStatus);

export default router;
