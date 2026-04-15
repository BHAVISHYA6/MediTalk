import express from 'express';
import {
  createAppointment,
  getMyAppointments,
  confirmAppointment,
  cancelAppointment,
  getJoinLink,
  joinAppointment,
  completeAppointment,
} from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createAppointment);
router.get('/me', getMyAppointments);
router.patch('/:id/confirm', confirmAppointment);
router.patch('/:id/cancel', cancelAppointment);
router.get('/:id/join-link', getJoinLink);
router.patch('/:id/join', joinAppointment);
router.patch('/:id/complete', completeAppointment);

export default router;
