import Notification from '../models/Notification.js';
import { sendResponse } from '../utils/response.js';

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return sendResponse(res, 200, true, 'Notifications fetched', notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return sendResponse(res, 500, false, error.message || 'Error fetching notifications');
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isRead: true },
      { new: true }
    ).lean();

    if (!notification) {
      return sendResponse(res, 404, false, 'Notification not found');
    }

    return sendResponse(res, 200, true, 'Notification marked as read', notification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    return sendResponse(res, 500, false, error.message || 'Error updating notification');
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    return sendResponse(res, 200, true, 'All notifications marked as read', {
      modifiedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return sendResponse(res, 500, false, error.message || 'Error updating notifications');
  }
};
