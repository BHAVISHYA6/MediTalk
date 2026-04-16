import express from 'express';
import {
  initiatePayment,
  processPayment,
  getPaymentDetails,
  getPaymentStatus,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Payment routes
router.post('/initiate', initiatePayment);
router.post('/process', processPayment);
router.get('/:appointmentId/details', getPaymentDetails);
router.get('/:appointmentId/status', getPaymentStatus);

export default router;
