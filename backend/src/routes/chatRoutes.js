import express from 'express';
import {
  getChatHistory,
  getConversations,
  sendMessage,
  getUnreadCount,
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All chat routes require authentication
router.use(authenticate);

// Chat routes
router.get('/conversations', getConversations);
router.get('/history/:userId', getChatHistory);
router.post('/send', sendMessage);
router.get('/unread-count', getUnreadCount);

export default router;
