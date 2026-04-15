import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

// Track online users
const onlineUsers = new Map(); // userId -> socketId
let ioInstance = null;

export const setupSocketIO = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('🔌 New socket connection:', socket.id);

    // User joins (on login)
    socket.on('join', (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        console.log(`✅ ${userId} joined. Online users:`, onlineUsers.size);
        
        // Broadcast online status
        io.emit('user_online', { userId, status: 'online' });
      }
    });

    // Send message via socket
    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, text, messageType = 'text', metadata = null } = data;
        const normalizedText =
          typeof text === 'string' && text.trim().length > 0
            ? text.trim()
            : messageType === 'prescription'
              ? 'Prescription shared'
              : messageType === 'appointment'
                ? 'Appointment proposal'
                : '';

        // Validate data
        if (!senderId || !receiverId || !normalizedText) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Save message to database
        const message = await Message.create({
          senderId,
          receiverId,
          text: normalizedText,
          messageType,
          metadata,
        });

        // Populate sender info
        const populatedMessage = await message.populate('senderId', 'name email role');

        // Update or create conversation safely for array participant matching.
        const existingConversation = await Conversation.findOne({
          participants: { $all: [senderId, receiverId] },
        });

        if (existingConversation) {
          existingConversation.lastMessage = normalizedText;
          existingConversation.lastMessageTime = new Date();
          await existingConversation.save();
        } else {
          await Conversation.create({
            participants: [senderId, receiverId],
            lastMessage: normalizedText,
            lastMessageTime: new Date(),
          });
        }

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', populatedMessage);
        }

        // Send confirmation to sender
        socket.emit('message_sent', populatedMessage);

        console.log(`💬 Message sent from ${senderId} to ${receiverId}`);
      } catch (error) {
        console.error('❌ Send message error:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Typing indicator
    socket.on('user_typing', (data) => {
      const { receiverId, senderName } = data;
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', { senderName });
      }
    });

    // Stop typing
    socket.on('user_stop_typing', (data) => {
      const { receiverId } = data;
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_stop_typing');
      }
    });

    // User disconnect
    socket.on('disconnect', () => {
      const userId = socket.userId;
      if (userId) {
        onlineUsers.delete(userId);
        console.log(`❌ ${userId} disconnected. Online users:`, onlineUsers.size);
        
        // Broadcast offline status
        io.emit('user_offline', { userId, status: 'offline' });
      }
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });
};

// Helper to get online users (for future use)
export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

export const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance || !userId) return;

  const socketId = onlineUsers.get(String(userId));
  if (socketId) {
    ioInstance.to(socketId).emit(eventName, payload);
  }
};
