import express from 'express';
import { listDoctors, getDoctorProfile } from '../controllers/doctorController.js';

const router = express.Router();

// Doctor routes
router.get('/', listDoctors);
router.get('/:id', getDoctorProfile);

export default router;
