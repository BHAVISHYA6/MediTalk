import express from 'express';
import { register, login, logout, getCurrentUser, getUserById } from '../controllers/authController.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Auth routes
router.post('/register', uploadMiddleware, register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);
router.get('/user/:userId', getUserById);

export default router;
