import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getPendingDoctors,
  getVerifiedDoctors,
  getDoctorById,
  approveDoctor,
  rejectDoctor,
  getAdminStats,
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get admin statistics
router.get('/stats', getAdminStats);

// Doctor management
router.get('/doctors/pending', getPendingDoctors);
router.get('/doctors/verified', getVerifiedDoctors);
router.get('/doctors/:id', getDoctorById);

// Approve/Reject doctors
router.patch('/doctors/:id/approve', approveDoctor);
router.patch('/doctors/:id/reject', rejectDoctor);

export default router;
