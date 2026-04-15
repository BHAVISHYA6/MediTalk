import express from 'express';
import {
	addReview,
	getDoctorReviews,
	getPendingRatingsForMe,
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Review routes
router.post('/', authenticate, addReview);
router.get('/pending/me', authenticate, getPendingRatingsForMe);
router.get('/:doctorId', getDoctorReviews);

export default router;
