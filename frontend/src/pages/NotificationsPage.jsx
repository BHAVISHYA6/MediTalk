import { useEffect, useMemo, useState } from 'react';
import { notificationService } from '../services/notificationService.jsx';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const handleMarkAsRead = async (id) => {
    try {
      setUpdating(true);
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      alert(err.response?.data?.message || 'Unable to update notification');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setUpdating(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      alert(err.response?.data?.message || 'Unable to update notifications');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">See appointment updates and reminders</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              disabled={loading || updating}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={handleMarkAllAsRead}
              disabled={updating || unreadCount === 0}
              className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              Mark All Read
            </button>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Unread: <span className="font-semibold text-gray-900">{unreadCount}</span>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-600">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-red-700">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-600">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`rounded-lg border p-4 ${
                  notification.isRead
                    ? 'bg-white border-gray-200'
                    : 'bg-orange-50 border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{notification.title}</p>
                    <p className="text-gray-700 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      disabled={updating}
                      className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
