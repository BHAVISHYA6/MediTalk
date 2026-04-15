import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { sendResponse } from '../utils/response.js';

// Get chat history between two users
export const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Validate users exist
    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    // Fetch messages
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .sort({ createdAt: 1 })
      .lean();

    // Keep appointment message status in sync with actual appointment records.
    const appointmentIds = messages
      .filter(
        (message) =>
          message.messageType === 'appointment' &&
          message.metadata?.appointmentId
      )
      .map((message) => String(message.metadata.appointmentId));

    if (appointmentIds.length > 0) {
      const appointments = await Appointment.find({
        _id: { $in: appointmentIds },
      })
        .select('_id status startTime endTime notes hasJoined joinedAt isMeetingCompleted endedBy cancellationReason')
        .lean();

      const appointmentMap = new Map(
        appointments.map((appointment) => [String(appointment._id), appointment])
      );

      messages.forEach((message) => {
        if (message.messageType !== 'appointment' || !message.metadata?.appointmentId) {
          return;
        }

        const appointment = appointmentMap.get(String(message.metadata.appointmentId));
        if (!appointment) {
          return;
        }

        message.metadata = {
          ...(message.metadata || {}),
          status: appointment.status,
          proposedTime: appointment.startTime,
          duration:
            appointment.startTime && appointment.endTime
              ? Math.max(
                  1,
                  Math.round(
                    (new Date(appointment.endTime).getTime() -
                      new Date(appointment.startTime).getTime()) /
                      (1000 * 60)
                  )
                )
              : message.metadata?.duration,
          notes:
            typeof appointment.notes === 'string' && appointment.notes.length > 0
              ? appointment.notes
              : message.metadata?.notes,
          hasJoined:
            typeof appointment.hasJoined === 'boolean'
              ? appointment.hasJoined
              : message.metadata?.hasJoined,
          joinedAt:
            appointment.joinedAt || message.metadata?.joinedAt,
          isMeetingCompleted:
            typeof appointment.isMeetingCompleted === 'boolean'
              ? appointment.isMeetingCompleted
              : message.metadata?.isMeetingCompleted,
          endedBy:
            appointment.endedBy || message.metadata?.endedBy,
          cancellationReason:
            appointment.cancellationReason || message.metadata?.cancellationReason,
        };
      });
    }

    // Mark messages as read
    await Message.updateMany(
      { receiverId: currentUserId, senderId: userId, isRead: false },
      { isRead: true }
    );

    return sendResponse(res, 200, true, 'Chat history fetched', messages);
  } catch (error) {
    console.error('Get chat history error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching chat history');
  }
};

// Get all conversations for user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find or create conversations
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'name email role specialization')
      .sort({ lastMessageTime: -1 })
      .lean();

    return sendResponse(res, 200, true, 'Conversations fetched', conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching conversations');
  }
};

// Send a message (REST fallback)
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, messageType = 'text', metadata = null } = req.body;
    const senderId = req.user._id;
    const normalizedText =
      typeof text === 'string' && text.trim().length > 0
        ? text.trim()
        : messageType === 'prescription'
          ? 'Prescription shared'
          : messageType === 'appointment'
            ? 'Appointment proposal'
            : '';

    // Validate input
    if (!receiverId || !normalizedText) {
      return sendResponse(res, 400, false, 'Receiver ID and text are required');
    }

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return sendResponse(res, 404, false, 'Receiver not found');
    }

    // Create message
    const message = await Message.create({
      senderId,
      receiverId,
      text: normalizedText,
      messageType,
      metadata,
    });

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

    // Populate sender info
    const populatedMessage = await message.populate('senderId', 'name email role');

    return sendResponse(res, 201, true, 'Message sent', populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    return sendResponse(res, 500, false, error.message || 'Error sending message');
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    });

    return sendResponse(res, 200, true, 'Unread count fetched', { unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching unread count');
  }
};
