import Notification from '../models/Notification.js';

export const createNotification = async ({
  userId,
  type = 'system',
  title,
  message,
  relatedId = null,
}) => {
  if (!userId || !title || !message) {
    throw new Error('userId, title and message are required to create notification');
  }

  return Notification.create({
    userId,
    type,
    title,
    message,
    relatedId,
  });
};

export const createNotificationsBatch = async (notifications = []) => {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  const validNotifications = notifications.filter(
    (item) => item?.userId && item?.title && item?.message
  );

  if (validNotifications.length === 0) {
    return [];
  }

  return Notification.insertMany(validNotifications, { ordered: false });
};
