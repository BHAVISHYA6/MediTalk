import express from 'express';
import {
  createPrescription,
  getPrescription,
  getPrescriptionByAppointment,
} from '../controllers/prescriptionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Prescription routes
router.post('/', createPrescription);
router.get('/:prescriptionId', getPrescription);
router.get('/appointment/:appointmentId', getPrescriptionByAppointment);

export default router;
